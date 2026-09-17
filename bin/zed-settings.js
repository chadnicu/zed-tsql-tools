#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

// Print only: users merge this into their settings without losing other preferences.
console.log(JSON.stringify({ languages: { SQL: {
  format_on_save: 'off',
  formatter: { external: {
    command: process.execPath,
    arguments: [fileURLToPath(new URL('./format.js', import.meta.url)),
      '--config', fileURLToPath(new URL('../examples/formatter.json', import.meta.url))],
  } },
} } }, null, 2));
