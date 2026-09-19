# Release status

Version: 0.1.0, unreleased. Updated 2026-09-19.

| Check | Status |
| --- | --- |
| Linux Node 22 tests | 19 tests passed on Node 22.22.2 |
| External formatter inside Zed on Linux | User-confirmed before release preparation |
| Portable archive / offline install | Passed locally; rechecked by package smoke test |
| Windows Node 22/24 | Passed in GitHub CI at 2bb59b8; dependency refresh verification pending |
| Linux Node 24 | Passed in GitHub CI at 2bb59b8; dependency refresh verification pending |
| Rust dependencies | Locked and checked against OSV |
| WASM adapter build | Maintainer reported local build passed; dev extension loaded on Linux |
| Dev adapter in Zed, Linux | Maintainer confirmed formatting on save in a scratch project with local binary settings at commit 3059ab1; Zed version and remaining acceptance checks pending |
| Dev adapter in Zed, Windows | Pending manual acceptance |
| Automatic npm installation in Zed | Implemented; disabled until npm publication and untested live |
| Live SQL Server query helper | Pending; experimental |
| npm account, GitHub owner/repository | Configured: @onta.nicolae/tsql-tools and chadnicu/zed-tsql-tools |
| Public npm/gallery publication | Not performed |

The repository can be shared for development. Do not describe it as a verified
cross-platform gallery release until the pending formatter/adapter checks pass.
Use [the acceptance checklist](acceptance.md) and record actual versions/commit IDs.
