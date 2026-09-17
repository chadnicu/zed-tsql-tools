# T-SQL tools for Zed — initial scope

Status: agreed scope reconstructed from the user requests in this conversation;
not a claim that every acceptance criterion has passed.

## Problem and objective

The user edits JavaScript, HTML, CSS, and SQL Server scripts together and wants
to move that workflow from VS Code to Zed. SQL work includes stored procedures,
CREATE/ALTER scripts, and querying databases. Poor Man's T-SQL Formatter already
produces formatting the user likes. Saved connections and staying in one editor
matter more than a separate database application.

Deliver in this order:

1. A working Poor Man's formatter wrapper.
2. Tested, documented Windows/Linux formatter integration.
3. A basic query helper with saved profiles and terminal results.

The user subsequently requested reuse on other machines and a possible public
extension. Prepare portable distribution and a development adapter, but **defer
all public publishing, remote repository creation, uploads, and registry PRs**.

## F1 — Local formatter

- Reuse Poor Man's T-SQL engine rather than replace it with another SQL formatter.
- Accept UTF-8 SQL on stdin and emit formatted SQL only on stdout.
- Expose documented configuration for formatting preferences. No requirement to
  infer the user's VS Code settings; equivalent output requires equivalent options.
- Support ordinary procedural T-SQL and GO-separated batches to the extent
  supported by the upstream engine. Document upstream syntax limitations.
- Preserve SQL literals, Unicode, comments, and statement meaning. Cosmetic
  repositioning of comments by the upstream engine must not be described as exact
  source preservation. Reject reported parse errors without returning replacement
  text; failures must be visible to the caller.
- Never execute SQL as part of formatting. Do not overwrite input files implicitly.

Acceptance: representative procedure/GO and query fixtures format successfully;
literal and comment content survives; formatting is idempotent for those fixtures;
malformed SQL and invalid configuration produce nonzero exit status and no SQL
on stdout. Blank input is handled without inventing SQL.

## F2 — Zed integration and portability

- Zed's Format command must invoke the formatter for SQL documents, including
  projects outside this repository. Do not rely on the caller being in this repo.
- Installation instructions must work on Linux and Windows with Node.js 22+.
  Handle installation paths containing spaces.
- Provide a way to produce machine-correct settings without embedding the author's
  home directory or overwriting unrelated editor settings.
- Provide a documented portable installation path before public distribution.
  An archive advertised as offline-installable must include its runtime dependencies.
- Explain user settings versus project overrides, required SQL syntax support,
  and how to keep manual formatting separate from format-on-save.

Acceptance: test the CLI and generated settings from another working directory;
install the archive into a fresh directory without registry access; run automated
checks on Windows and Linux; manually verify formatting in Zed on both platforms.
Record unperformed checks as pending, not as successful. Linux CLI and user-confirmed
Linux Zed formatting do not prove Windows support.

## Q1 — Basic database query helper

- Save named connection profiles outside the source checkout by default.
- Execute a deliberately selected saved SQL file against an explicitly selected
  profile and show results/errors in Zed's terminal.
- Document whether execution uses saved contents or the current unsaved buffer.
  Preserve GO batch handling and SQL Server scripting behavior by using sqlcmd.
- Store connection metadata and authentication choice, not plaintext passwords.
  A password prompt or an explicitly named environment variable is sufficient
  for this initial version; OS keychain integration is deferred.
- Surface missing profiles, missing files, unavailable sqlcmd, authentication
  prerequisites, and SQL errors. Preserve a failing child exit status.
- Cancellation should terminate/interrupt the running client and release the task;
  it must not be represented as automatic transaction rollback.
- Do not run database queries during local formatter/setup tests. Live validation
  must use an explicitly selected development connection.

Acceptance: profile persistence and duplicate handling; paths with spaces;
credentials excluded from stored profiles and command arguments; argument passing
without a shell; missing-dependency and child-failure handling. Live development
database checks must cover connection, Unicode, multiple batches, SQL failure,
and cancellation on the target platforms before claiming validated integration.

## E1 — Extension preparation, not public release

- A formatting-only language server is an acceptable bridge to Zed's supported
  extension API. It must format editor buffers, including unsaved changes, without
  reading stale disk contents or executing queries.
- A small Rust/WASM adapter may register this server for the existing SQL language.
  Reuse the existing syntax extension instead of duplicating its grammar.
- Keep the working external-formatter route available while the adapter is being
  built and tested. Development overrides may use machine-specific executable paths.
- Keep licensing and third-party notices explicit for the formatter, server, and
  separately distributed adapter.
- Do not download a package under an unowned/unpublished name. Final npm identity,
  public repository metadata, automatic download setup, and gallery submission
  remain release work after the user supplies the repository/account details.

Acceptance for preparation: real LSP initialization, document synchronization,
formatting, and error behavior tested over the protocol; adapter source and exact
local build/install steps provided. A gallery-ready claim additionally requires
a successful adapter build, manual Zed checks at the submitted revision, confirmed
package ownership, and working versioned installation. Those are not implied by
Node test results.

## Explicit exclusions

No native object explorer, result grid, database administration UI, query history,
persistent SQL session, Entra/MFA implementation, selection execution, or automatic
connection syncing in this phase. A CLI/task helper is not a VS Code MSSQL replacement.
Public availability and Zed registry acceptance are not deliverables of this local
preparation/review task.

## Workflow constraints

The user runs fish. Human-run commands must be fish-compatible (Windows-specific
PowerShell examples must be labeled). Leave sudo, GUI interaction, and long
installs/builds to the user with exact commands. Keep communication concise.
Local Git initialization and commits are authorized for establishing a reviewable
baseline. Preserve unrelated work; do not publish.

## Review traceability

Spec source: the conversation, especially the user's ordered three-stage request,
the confirmed successful formatter integration in another project, the request
for use on other machines, and the instruction to leave publishing for later.
There is no originating issue tracker or external ticket for this work.

## Release-readiness follow-up

The user subsequently requested professional open-source preparation: security
scanning, code cleanup, documentation, and exact steps for GitHub/npm/community
distribution. This authorizes local fixes, contributor/security documents,
automated checks, and release configuration tooling. It does not authorize remote
publication. Identify account/metadata inputs and unfinished platform/editor
validation clearly; do not substitute configured CI for a successful run.
