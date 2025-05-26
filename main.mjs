import { Parser } from "acorn";
import { generate } from "astring";

function processMarkAST(markAST, recurse = false) {
  const marks = [];
  const mark = { name: markAST.callee.property.name, options: {} };

  mark.options.data = generate(markAST.arguments[0]);
  for (const subOption of markAST.arguments[1]?.properties || []) {
    mark.options[subOption.key.name] = generate(subOption.value);
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
    const markOptionsString = Object.keys(mark.options)
      .map((key) => formatProp(key, mark.options[key]))
      .join(" ");

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
    console.log("User input:", userInput.trim());
    console.log("\n\n\n");

    console.log(convertToSvelte(userInput));

    process.exit();
  });
};

processSTDIN();
