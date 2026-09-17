# Release status

Version: 0.1.0, unreleased. Updated 2026-09-17.

| Check | Status |
| --- | --- |
| Linux Node 22 tests | 18 tests passed on Node 22.22.2 |
| External formatter inside Zed on Linux | User-confirmed before release preparation |
| Portable archive / offline install | Passed locally; rechecked by package smoke test |
| Windows Node 22/24 | CI configured; not run here |
| Linux Node 24 | CI configured; not run here |
| Rust dependencies | Locked and checked against OSV |
| WASM adapter build | Pending local/CI build |
| Dev adapter in Zed, Linux/Windows | Pending manual acceptance |
| Automatic npm installation in Zed | Implemented; disabled until npm publication and untested live |
| Live SQL Server query helper | Pending; experimental |
| npm account, GitHub owner/repository | Maintainer must configure |
| Public npm/gallery publication | Not performed |

The repository can be shared for development. Do not describe it as a verified
cross-platform gallery release until the pending formatter/adapter checks pass.
Use [the acceptance checklist](acceptance.md) and record actual versions/commit IDs.
