import { Parser } from "acorn";
import { generate } from "astring";

function processMarkAST(markAST, recurse = false) {
  const marks = [];
  const mark = { name: markAST.callee.property.name, options: {} };

  mark.options.data = generate(markAST.arguments[0]);
  for (const subOption of markAST.arguments[1].properties) {
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

  for (const option of startNode.arguments[0].properties) {
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

function convertToSvelte(plotString) {
  const { plotOptions, marks } = parsePlotString(plotString);

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const plotOptionsString = Object.keys(plotOptions)
    .map((key) => `${key}=${plotOptions[key]}`)
    .join(" ")
    .replace(/\n/g, "");

  let output = "";

  output += `<Plot ${plotOptionsString} >\n`;

  for (const mark of marks) {
    const markOptionsString = Object.keys(mark.options)
      .map((key) => `${key}={${mark.options[key]}}`)
      .join(" ");

    output += `  <${capitalizeFirstLetter(
      mark.name
    )} ${markOptionsString} />\n`;
  }
  output += `</Plot>\n`;

  return output;
}

const examples = [
  "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'})] })",
  "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'})], y: {grid: true} })",

  "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'}), Plot.circle(aapl, {x: 'Date', y: 'Close'})] })",

  "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).plot({y: {grid: true}})",
  "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).circle(aapl, {x: 'Date', y: 'Close'}).plot({y: {grid: true}})",
];

for (const example of examples) {
    console.log(example);
    console.log("\n");
    console.log(convertToSvelte(example));
    console.log("\n\n");
  }
  
  