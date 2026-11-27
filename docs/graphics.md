# Inline charts

Nexa writes charts directly in its web chat reply. A chart is a fenced code block whose language is `chart`: a few `key: value` settings, a `---` line, then the data as CSV with one header row. Web chat renders the block as a native, interactive chart in the site theme and draws it while the reply streams. There is no tool call, discovery step or extra model round trip. Diagrams of structure or flow are written the same way as inline SVG; see [Inline SVG diagrams](visual-responses.md).

Nexa charts numbers that compare, trend, distribute or relate in a way a sentence cannot show. It plots only numbers it has from the user, files, tool results or well-established facts, fetches them first when they must be looked up, and labels illustrative data as illustrative. One or two values, or a simple calculation, stay as text.

The authoring rules live in `src/visuals/InlineChartGuidance.ts` and are included in the system prompt only on surfaces that render inline visuals (web chat and the gateway). Channels such as Telegram and Discord never receive them.

## Format

```chart
type: bar
title: Revenue by region
description: Quarterly revenue in 2026, in millions of US dollars.
unit: $M
source: Company 10-Q filings
---
Quarter,North America,Europe
Q1,120,90
Q2,135,92
Q3,150,104
Q4,171,110
```

The first column labels each row: a category, a date or an x value. Every other column is a series, up to eight. Cells hold plain numbers; the unit goes in `unit:` and an empty cell is a gap. Dates are written as `YYYY`, `YYYY-Q1`, `YYYY-MM`, `YYYY-MM-DD` or ISO timestamps and keep their real spacing on a time axis. Rows can also be separated by tabs, semicolons or Markdown table pipes, and a chart can hold up to 20,000 rows.

| Type                                | Columns                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `line`, `area`                      | label or date, then one column per series                                                                    |
| `bar`, `hbar`                       | category, then series; `hbar` draws horizontal bars for long labels and rankings                             |
| `scatter`                           | x, y (more y columns are more series), optional `label` and `group` columns; `trend` and `connect` add lines |
| `bubble`                            | label, x, y, size                                                                                            |
| `pie`, `donut`, `treemap`, `funnel` | label, value                                                                                                 |
| `radar`                             | axis, then series                                                                                            |
| `heatmap`                           | row label, then one column per matrix column                                                                 |
| `waterfall`                         | step, change; `total` in a change cell draws the running total                                               |
| `histogram`                         | one column of raw values                                                                                     |
| `candlestick`                       | date, open, high, low, close                                                                                 |
| `boxplot`                           | group, min, q1, median, q3, max, or one column of raw values per group                                       |
| `metric`                            | label, value, change, note: up to four headline figures written as displayed                                 |

Settings:

- `type` and `title` are required. Common synonyms such as `kind`, `subtitle`, `stacked-bar`, `horizontal-bar` or `doughnut` are accepted.
- `description` is a short sentence shown as the chart's caption, and `source` cites the data.
- `x` and `y` title the axes; `unit` formats every value (`%`, `$`, `$M`, `ms`, `K users`).
- `stack: true` or `stack: percent` stacks bars or areas.
- `curve: smooth` or `curve: step` shapes lines, and `markers: true` puts a point on every value.
- `labels: true` or `false` prints or hides values on bars.
- `lines` draws the named series as lines over bars, and `dashed` dashes projected or target series.
- `highlight` keeps one series or category in colour and greys the rest.
- `colors` assigns hues in series order from blue, orange, teal, amber, pink, green, purple, red and gray.
- `min`, `max`, `log: true` and `bins` control the value axis and histogram bins.
- `trend: true` draws a dashed least-squares line through each scatter group, and `connect: true` joins a group's points in row order (`type: connected-scatter` does the same).

Unknown settings are ignored and listed under the chart.

## Rendering

Web chat reads the block line by line. The frame, title and legend appear as soon as the settings and header arrive, at the height the chart will have. Each completed row joins the plot: bars grow from the baseline, lines extend from their last point, slices make room for new ones and the axes rescale smoothly. A half-written row is never drawn.

Charts share the diagram frame, caption footer and hue names. The frame is a flat 12px panel like Chat's other cards and the site's panels, and the title uses the site's panel title type. Data marks use the figure hues stepped for data and validated for colour-blind separation on the light and dark surfaces. Ticks fall on round numbers and calendar boundaries. Two to eight series get a legend that toggles each one, and two to four lines whose ends do not collide are labelled where they end. A pie with more than eight slices folds the smallest into Other.

Readers can point at, tap or arrow through the data for a tooltip, switch to a data table, view and copy the source, download the chart as SVG or its data as CSV, and expand it. Long lines are reduced to a few points per pixel with a shape-preserving method, and dense scatter plots draw as one path, so large tables stay fast while the tooltip and table read every row.

## Safety

The chart is built from parsed cells. No text from the block reaches an HTML sink, and labels are rendered as text. Downloads write CSV with formula-looking cells escaped. Rows, columns and cell length are bounded.

## Other clients

Clients other than web chat see an ordinary fenced code block and can show it as code, or parse it with the rules above. Replies saved before inline charts may contain `graphic` events from the retired `render_graphic` tool; current replies never produce them.
