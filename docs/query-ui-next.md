# Query results: next iteration

Deferred until after the formatter's first gallery submission. The npm 0.1.0
package is already published; query changes require a new package version.

## Problem

Current output uses sqlcmd's `-W -s |`. This removes excessive padding but does
not align headings with values. Wide result sets are difficult to follow.
Every execution also creates a new connection; latency has not been measured.

## Scope to design

- Evaluate maintained open-source terminal table libraries and SQL terminal UIs.
  Check licenses and reuse dependencies rather than copying unattributed code.
- Render aligned headings and cells with Unicode-aware widths, NULL values,
  multiline content, and multiple result sets.
- Bound memory and handle wide/large results with truncation, paging or scrolling;
  offer a vertical record view when a table cannot fit the terminal.
- Obtain structured rows and column metadata. Do not split sqlcmd text on pipes:
  actual values can contain pipes, newlines, and header-like text.
- Measure connection, execution and rendering time separately before choosing
  persistent connection/session behavior. Define cancellation, transactions,
  reconnects and credential lifetime before adding connection reuse.
- Keep tests synthetic; do not commit customer records or credential values.

The first release remains a formatter extension with an experimental query CLI.
This document is a follow-up brief, not a promise of a full database IDE.
