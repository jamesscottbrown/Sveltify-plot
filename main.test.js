import { expect, test } from "vitest";

import { convertToSvelte } from "./main.mjs";

expect.extend({
  toMatchIgnoringWhitespace(received, expected) {
    const normalize = (str) => str.replace(/\s+/g, "").toLowerCase();
    const pass = normalize(received) === normalize(expected);

    return {
      message: () =>
        `expected ${received} to match ${expected} ignoring whitespace`,
      pass,
    };
  },
});

test("linechart example", () => {
  const str =
    "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'})] })";

  expect(convertToSvelte(str)).toMatchIgnoringWhitespace(`<Plot  >
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>`);
});

test("linechart with grid", () => {
  const str =
    "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'})], y: {grid: true} })";

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot y={  grid: true} >
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>`);
});

test("linechart with points", () => {
  const str =
    "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'}), Plot.circle(aapl, {x: 'Date', y: 'Close'})] })";

  expect(convertToSvelte(str)).toMatchIgnoringWhitespace(`<Plot  >
  <LineY data={aapl} x={'Date'} y={'Close'} />
  <Circle data={aapl} x={'Date'} y={'Close'} />
</Plot>`);
});

test("linechart with grid (alternate syntax)", () => {
  const str =
    "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).plot({y: {grid: true}})";

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot y={  grid: true} >
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>`);
});

test("linechart with grid", () => {
  const str =
    "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).circle(aapl, {x: 'Date', y: 'Close'}).plot({y: {grid: true}})";

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot y={  grid: true} >
  <Circle data={aapl} x={'Date'} y={'Close'} />
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>`);
});

test("calling .plot() with no arguments", () => {
  const str = "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).plot()";

  expect(convertToSvelte(str)).toMatchIgnoringWhitespace(`<Plot >
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>`);
});
