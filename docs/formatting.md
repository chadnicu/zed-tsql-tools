# Formatting

`--config` is optional; omitted means upstream defaults. The example selects
four-space indentation, leading commas, and separate JOIN/ON lines. Supported
settings are the standard text-formatting options in the
[upstream README](https://github.com/TaoK/PoorMansTSqlFormatter).
Unknown keys and wrong types fail. No implicit project-config discovery.

SQL alone goes to stdout. Parse failures produce stderr and exit 1 without
formatted output, so Zed can retain the original document. Blank input is
unchanged. The wrapper preserves upstream line endings; it does not rewrite
multiline string literals to force a document-wide newline style.

Standalone `GO` and `GO count` directives are preserved verbatim, including inline
comments and their line endings; each SQL batch is formatted separately. Text
inside quoted strings/identifiers or block comments is not treated as a directive.
A GO directive sharing a multiline block-comment boundary is rejected rather
than risking changes to the script. A failure in any batch rejects the entire
formatting operation.

The engine is pinned to `poor-mans-t-sql-formatter@1.6.10`. Its parser is coarse
and may not understand newer T-SQL. A successful format is not SQL validation.
Compare formatting against your stored procedures before enabling format on save.


The CLI and LSP use the same formatter and batch handling. The LSP honors editor
indentation unless `initialization_options.formatter.indent` overrides it. Restart
the language server after changing initialization options. Whole-document formatting
is supported; range formatting is not advertised.
