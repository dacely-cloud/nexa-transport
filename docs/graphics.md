# Native chat graphics

Nexa can deliver interactive graphics directly in web chat with `render_graphic`.
No generated website, script, upload or external chart service is required.
Use `render_graph` for draggable relationship maps and flow diagrams.

Discover the tool using `tool_search` and inspect its schema with `tool_describe`.
Read the source data before plotting it. Include units and a plain-text source
citation; do not invent measurements. Chart measurements are finite numbers with
absolute value at most 1e15. Scale large quantities explicitly. Preserve exact
financial values in accompanying text rather than calculating money with floats.

```json
{
    "version": 1,
    "id": "api-latency",
    "title": "API latency by release",
    "description": "Median latency measured against the same workload.",
    "kind": "area",
    "style": "studio",
    "xLabel": "Release",
    "yLabel": "Latency",
    "unit": "ms",
    "source": "Local benchmark results",
    "series": [
        {
            "name": "API",
            "points": [
                { "label": "August", "value": 42 },
                { "label": "September", "value": 28 },
                { "label": "October", "value": 17 }
            ]
        }
    ]
}
```

Supported kinds: `line`, `area`, `bar`, `stacked-bar`, `scatter`, `pie`, `donut`,
`radar`, `heatmap`, `treemap`, `funnel`, `metric`.

Styles: `studio` uses the Nerva homepage's orange accent, light surfaces and grid;
`midnight` uses a dark neutral surface; `blueprint` uses blue technical drawings;
`aurora` uses violet and mint; `minimal` uses a quiet monochrome palette.

A graphic has 1–8 uniquely named series and 1–256 uniquely labelled points per
series. Categorical series must share the same ordered labels. Scatter points
require numeric `x` coordinates and use `value` for the vertical coordinate.
Pie, donut, treemap, funnel and metric graphics use exactly one series.
Pie, donut, treemap, funnel and radar values must be nonnegative. Radar charts
have 3–24 axes; metric cards have at most 12 values. All-zero part-to-whole
charts show an empty state. A validated graphic may occupy at most 256 KiB.

Chat supports pointer and keyboard inspection, series visibility, style changes,
an accessible data table, expansion with Escape to close, and standalone SVG
downloads. Labels and citations are rendered as plain text. The view uses React
and inert SVG, never model-authored HTML or executable chart expressions.

Successful native calls emit a correlated `graphic` packet on `turn.event`
before `tool-finish`. The packet carries `call` and the versioned `graphic`.
The structured graphic also lives on the tool outcome and saved `tool-result`
block, separately from bounded model-visible text. Live session subscribers,
the presentation journal, and transcript restoration retain the same visual.
