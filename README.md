## Sveltify-plot

A quick hacky script that uses `acorn` to parse JS code for an Observable Plot plot, and produces some svelte-like code.

A POC for auto-converting examples for [SveltePlot](https://www.vis4.net/blog/2024/01/svelteplot/)

Note that this is currntly incomplete.

Install dependencies with `npm install`, then run with `node main.mjs`: as a CLI tool it reads from STDIN and writes to STDOUT.

For examples of input/output pairs, see the tests in [main.test.js](./main.test.js).