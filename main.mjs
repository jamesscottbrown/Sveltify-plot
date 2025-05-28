import { Parser } from "acorn";
import { generate } from "astring";

function processMarkAST(markAST, recurse = false) {
  const marks = [];
  const mark = { name: markAST.callee.property.name, options: {} };

  // if a transform, then markAST.type === "CallExpression";

  // here may be no arguments, as in `Plot.frame()`
  if (markAST.arguments.length > 0) {
    mark.options.data = generate(markAST.arguments[0]);
  }

  if (markAST.arguments[1]?.properties) {
    // second argument to the mark function is options
    for (const subOption of markAST.arguments[1]?.properties || []) {
      mark.options[subOption.key.name] = generate(subOption.value);
    }
  } else if (markAST.arguments[1]?.type === "CallExpression") {
    const transformName = markAST.arguments[1].callee.property.name;
    mark.transform = {};
    mark.transform.name = transformName;

    const optionsAST = markAST.arguments[1].arguments[0];
    mark.transform.transformOptions = optionsAST ? generate(optionsAST) : null;

    const markOptions = {};
    if (markAST.arguments[1].arguments.length > 1) {
      for (const p of markAST.arguments[1].arguments[1].properties) {
        markOptions[p.key.name] = generate(p.value).slice(1, -1);
      }
    }
    mark.transform.markOptions = markOptions;
  }

  marks.push(mark);

  if (recurse && markAST?.callee?.object?.callee?.property) {
    marks.push(...processMarkAST(markAST.callee.object, recurse));
  }

  return marks;
}

function parsePlotString(plotString) {
  const ast = Parser.parse(plotString, { ecmaVersion: 2020 });

  const startNode = ast.body[0].expression;

  let plotOptions = {};
  let marks = [];

  // Handle chain of function calls before .plot() in an expression like:
  // Plot.lineY(aapl, {x: 'Date', y: 'Close'}).circle(aapl, {x: 'Date', y: 'Close'}).plot({y: {grid: true}})
  if (startNode.callee.object.callee) {
    const markAST = startNode.callee.object;
    marks.push(...processMarkAST(markAST, true));
  }

  for (const option of startNode.arguments[0]?.properties ?? []) {
    if (option.key.name === "marks") {
      for (const markAST of option.value.elements) {
        marks.push(...processMarkAST(markAST));
      }
    } else {
      plotOptions[option.key.name] = generate(option.value);
    }
  }

  return { plotOptions, marks };
}

const formatProp = (key, value) => {
  const parsed = Parser.parseExpressionAt(value, 0, { ecmaVersion: 2020 });

  if (
    [
      "ObjectExpression",
      "Identifier",
      "ArrayExpression",
      "ArrowFunctionExpression",
    ].includes(parsed.type)
  ) {
    return `${key}={${value}}`;
  } else if (parsed.type === "Literal" && typeof parsed.value === "number") {
    return `${key}={${value}}`;
  } else if (parsed.type === "Literal") {
    return `${key}=${value}`;
  } else if (typeof parsed.value === "string") {
    return `${key}="${value}"`;
  } else if (typeof parsed.value === "number") {
    return `${key}={${value}}`;
  }
  return `${key}=${value}`;
};

const formatMark = (mark) => {
  if (mark.transform) {
    const opts = JSON.stringify(mark.transform.markOptions).slice(1, -1);

    let markOptions = "";
    if (opts.length === 0) {
      markOptions = `{data: ${mark.options.data}}`;
    } else {
      markOptions = `{data: ${mark.options.data}, ${opts}}`;
    }

    if (mark.transform.transformOptions) {
      return `{...${mark.transform.name}(${markOptions}, ${mark.transform.transformOptions} )}`;
    } else {
      return `{...${mark.transform.name}(${markOptions} )}`;
    }
  } else {
    return Object.keys(mark.options)
      .map((key) => formatProp(key, mark.options[key]))
      .join(" ");
  }
};

export function convertToSvelte(plotString) {
  const { plotOptions, marks } = parsePlotString(plotString);

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const plotOptionsString = Object.keys(plotOptions)
    .map((key) => formatProp(key, plotOptions[key]))
    .join(" ")
    .replace(/\n/g, "");

  let output = "";

  output += `<Plot ${plotOptionsString} >\n`;

  for (const mark of marks) {
    const markOptionsString = formatMark(mark);

    output += `  <${capitalizeFirstLetter(
      mark.name,
    )} ${markOptionsString} />\n`;
  }
  output += `</Plot>\n`;

  return output;
}

const processSTDIN = () => {
  process.stdin.resume();
  process.stdin.setEncoding("utf-8");

  let userInput = "";

  process.stdin.on("data", (data) => {
    userInput += data;
  });

  process.stdin.on("end", () => {
    console.log(convertToSvelte(userInput));
    process.exit();
  });
};

processSTDIN();
