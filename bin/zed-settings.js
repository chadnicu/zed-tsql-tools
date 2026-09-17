#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

// Print only: users merge this into their settings without losing other preferences.
const { values } = parseArgs({ options: { lsp: { type: 'boolean' } } });
const settings = { languages: { SQL: {
  format_on_save: 'off',
  formatter: { external: {
    command: process.execPath,
    arguments: [fileURLToPath(new URL('./format.js', import.meta.url)),
      '--config', fileURLToPath(new URL('../examples/formatter.json', import.meta.url))],
  } },
} } };
if (values.lsp) {
  settings.languages.SQL.formatter = 'language_server';
  settings.languages.SQL.language_servers = ['poor-mans-tsql-lsp', '...'];
  settings.lsp = { 'poor-mans-tsql-lsp': {
    binary: { path: process.execPath, arguments: [fileURLToPath(new URL('./lsp.js', import.meta.url))] },
    initialization_options: { formatter: JSON.parse(readFileSync(new URL('../examples/formatter.json', import.meta.url), 'utf8')) },
  } };
}
console.log(JSON.stringify(settings, null, 2));
