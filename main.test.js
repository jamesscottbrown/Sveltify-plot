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
  <LineY data={aapl} x='Date' y='Close' />
</Plot>`);
});

test("linechart with grid", () => {
  const str =
    "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'})], y: {grid: true} })";

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot y={ {grid: true}} >
  <LineY data={aapl} x='Date' y='Close' />
</Plot>`);
});

test("linechart with points", () => {
  const str =
    "Plot.plot({  marks: [Plot.lineY(aapl, {x: 'Date', y: 'Close'}), Plot.circle(aapl, {x: 'Date', y: 'Close'})] })";

  expect(convertToSvelte(str)).toMatchIgnoringWhitespace(`<Plot  >
  <LineY data={aapl} x='Date' y='Close' />
  <Circle data={aapl} x='Date' y='Close' />
</Plot>`);
});

test("linechart with grid (alternate syntax)", () => {
  const str =
    "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).plot({y: {grid: true}})";

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot y={{grid: true}} >
  <LineY data={aapl} x='Date' y='Close' />
</Plot>`);
});

test("linechart with grid", () => {
  const str =
    "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).circle(aapl, {x: 'Date', y: 'Close'}).plot({y: {grid: true}})";

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot y={{grid: true}} >
  <Circle data={aapl} x='Date' y='Close' />
  <LineY data={aapl} x='Date' y='Close' />
</Plot>`);
});

test("calling .plot() with no arguments", () => {
  const str = "Plot.lineY(aapl, {x: 'Date', y: 'Close'}).plot()";

  expect(convertToSvelte(str)).toMatchIgnoringWhitespace(`<Plot >
  <LineY data={aapl} x='Date' y='Close' />
</Plot>`);
});

test("a broken example", () => {
  const str = `Plot.plot({
  y: {
    grid: true,
    tickFormat: "+f",
    label: "↑ Surface temperature anomaly (°C)"
  },
  color: {
    scheme: "BuRd",
    legend: true
  },
  marks: [
    Plot.ruleY([0]),
    Plot.dot(gistemp, {x: "Date", y: "Anomaly", stroke: "Anomaly"})
  ]
})`;

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot y={ { grid: true,  tickFormat: "+f",  label: "↑ Surface temperature anomaly (°C)"}} color={  {scheme: "BuRd",  legend: true}} >
  <RuleY data={[0]} />
  <Dot data={gistemp} x="Date" y="Anomaly" stroke="Anomaly" />
</Plot>
`);
});

test("Using a function to define an encoding", () => {
  const str = `Plot.plot({
  grid: true,
  x: {
    label: "Daily change (%) →",
    tickFormat: "+f",
    percent: true
  },
  y: {
    type: "log",
    label: "↑ Daily trading volume"
  },
  marks: [
    Plot.ruleX([0]),
    Plot.dot(aapl, {x: (d) => (d.Close - d.Open) / d.Open, y: "Volume", r: "Volume"})
  ]
})`;

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot grid=true x={{  label: "Daily change (%) →",  tickFormat: "+f",  percent: true}} y={{  type: "log",  label: "↑ Daily trading volume"}} >
  <RuleX data={[0]} />
  <Dot data={aapl} x={d => (d.Close - d.Open) / d.Open} y="Volume" r="Volume" />
</Plot>
`);
});

test("Numerical plot attribute", () => {
  const str = `Plot.plot({
  marginLeft: 60,
  x: {inset: 10},
  y: {label: null},
  marks: [
    Plot.dot(penguins, {x: "body_mass_g", y: "species", stroke: "sex"})
  ]
})`;
  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot marginLeft={60} x={{  inset: 10}} y={{  label: null}} >
  <Dot data={penguins} x="body_mass_g" y="species" stroke="sex" />
</Plot>`);
});

test("a transform function", () => {
  const str =
    'Plot.rectY(olympians, Plot.binX({y: "count"}, {x: "weight", fill: "sex"})).plot()';

  expect(convertToSvelte(str)).toMatchIgnoringWhitespace(`<Plot  >
  <RectY {...binX({data: olympians, "x":"weight","fill":"sex"}, {
  y: "count"
} )} />
</Plot>
`);
});

test("Ordinal scatterplot example", () => {
  // https://observablehq.com/@observablehq/plot-ordinal-scatterplot
  const str = `Plot.plot({
  label: null,
  marginLeft: 60,
  height: 240,
  grid: true,
  r: {range: [0, 40]},
  marks: [
    Plot.dot(penguins, Plot.group({r: "count"}, {x: "species", y: "island", stroke: "sex"}))
  ]
})
  `;

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot label=null marginLeft={60} height={240} grid=true r={{  range: [0, 40]}} >
  <Dot {...group(
      {data: penguins, "x":"species","y":"island","stroke":"sex"}, 
      { r: "count" } 
    )} 
   />
</Plot>
`);
});

test("another transform function", () => {
  const str = `Plot.plot({
  aspectRatio: 1,
  x: {label: "Age (years)"},
  y: {
    grid: true,
    label: "← Women · Men →",
    labelAnchor: "center",
    tickFormat: Math.abs
  },
  marks: [
    Plot.dot(
      congress,
      Plot.stackY2({
        x: (d) => 2023 - d.birthday.getUTCFullYear(),
        y: (d) => d.gender === "M" ? 1 : -1,
        fill: "gender",
        title: "full_name"
      })
    ),
    Plot.ruleY([0])
  ]
})`;

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot aspectRatio={1} x={{  label: "Age (years)"}} y={{  grid: true,  label: "← Women · Men →",  labelAnchor: "center",  tickFormat: Math.abs}} >
  <Dot {...stackY2({data: congress}, {
  x: d => 2023 - d.birthday.getUTCFullYear(),
  y: d => d.gender === "M" ? 1 : -1,
  fill: "gender",
  title: "full_name"
} )} />
  <RuleY data={[0]} />
</Plot>
`);
});

test("2D faceting", () => {
  const str = `Plot.plot({
  grid: true,
  marginRight: 60,
  facet: {label: null},
  marks: [
    Plot.frame(),
    Plot.dot(penguins, {
      x: "culmen_length_mm",
      y: "culmen_depth_mm",
      fx: "sex",
      fy: "species"
    })
  ]
})`;

  expect(convertToSvelte(str))
    .toMatchIgnoringWhitespace(`<Plot grid=true marginRight={60} facet={{  label: null}} >
  <Frame  />
  <Dot data={penguins} x="culmen_length_mm" y="culmen_depth_mm" fx="sex" fy="species" />
</Plot>
`);
});
