# Third-party dependency

- Package: `poor-mans-t-sql-formatter`, version 1.6.10
- Author/project: Tao Klerks, https://github.com/TaoK/PoorMansTSqlFormatter
- Declared license: AGPL-3.0
- Installed dependency retains its original license and bundled notices,
  including the Bridge.NET runtime notices.

The formatter engine is used as an npm dependency, not copied or relicensed.
The Node tools use AGPL-3.0-only (root LICENSE). The separate Rust extension
adapter has its own MIT license under `extension/LICENSE`.

The language server also uses Microsoft's MIT-licensed `vscode-languageserver`,
`vscode-languageserver-textdocument`, and their transitive dependencies. Portable
archives retain the dependencies' license files. Publication remains disabled
until the owner and npm package name are configured (`private: true`).
