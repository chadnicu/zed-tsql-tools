# Release status

Version: 0.1.0, published to npm; gallery submission pending. Updated 2026-09-20.

| Check | Status |
| --- | --- |
| Linux Node 22 tests | 20 tests passed locally including installed Go sqlcmd flag check |
| External formatter inside Zed on Linux | User-confirmed before release preparation |
| Portable archive / offline install | Passed locally; rechecked by package smoke test |
| Windows Node 22/24 | Passed in GitHub CI at bbbf77b |
| Linux Node 24 | Passed in GitHub CI at bbbf77b |
| Rust dependencies | Locked and checked against OSV |
| WASM adapter build | Maintainer reported local build passed; dev extension loaded on Linux |
| Dev adapter in Zed, Linux | Maintainer confirmed formatting on save in a scratch project with local binary settings at commit 3059ab1; Zed version and remaining acceptance checks pending |
| Dev adapter in Zed, Windows | Pending manual acceptance |
| Automatic npm installation in Zed | Enabled for published npm 0.1.0; manual download/formatting check pending |
| Live SQL Server query helper | Maintainer confirmed a SELECT query on Linux; broader acceptance pending; experimental |
| npm account, GitHub owner/repository | Configured: @onta.nicolae/tsql-tools and chadnicu/zed-tsql-tools |
| Public npm/gallery publication | npm 0.1.0 verified; Zed gallery pending |

The repository can be shared for development. Do not describe it as a verified
cross-platform gallery release until the pending formatter/adapter checks pass.
Use [the acceptance checklist](acceptance.md) and record actual versions/commit IDs.
