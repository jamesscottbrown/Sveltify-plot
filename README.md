## Sveltify-plot

A quick hacky script that uses `acorn` to parse JS code for an Observable Plot plot, and produces some svelte-like code.

A POC for auto-converting examples for [SveltePlot](https://www.vis4.net/blog/2024/01/svelteplot/)

Note that this is incomplete: for example, it doesn't handle transforms like `Plot.stackY`.

Install dependencies with `npm install`, then run with `node main.mjs`.

## Example output

Example 1:

```js
Plot.plot({ marks: [Plot.lineY(aapl, { x: "Date", y: "Close" })] });
```

```svelte
<Plot  >
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>
```

Example 2:

```js
Plot.plot({
  marks: [Plot.lineY(aapl, { x: "Date", y: "Close" })],
  y: { grid: true },
});
```

```svelte

<Plot y={  grid: true} >
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>
```

Example 3:

```js
Plot.plot({
  marks: [
    Plot.lineY(aapl, { x: "Date", y: "Close" }),
    Plot.circle(aapl, { x: "Date", y: "Close" }),
  ],
});
```

```svelte

<Plot  >
  <LineY data={aapl} x={'Date'} y={'Close'} />
  <Circle data={aapl} x={'Date'} y={'Close'} />
</Plot>
```

Example 4:

```js
Plot.lineY(aapl, { x: "Date", y: "Close" }).plot({ y: { grid: true } });
```

```svelte

<Plot y={  grid: true} >
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>
```

Example 5:

```js
Plot.lineY(aapl, { x: "Date", y: "Close" })
  .circle(aapl, { x: "Date", y: "Close" })
  .plot({ y: { grid: true } });
```

```svelte

<Plot y={  grid: true} >
  <Circle data={aapl} x={'Date'} y={'Close'} />
  <LineY data={aapl} x={'Date'} y={'Close'} />
</Plot>
```
