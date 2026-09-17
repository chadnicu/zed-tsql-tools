#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { formatSql } from '../src/formatter.js';

try {
  const { values } = parseArgs({ options: {
    config: { type: 'string' }, help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log('Usage: node bin/format.js [--config options.json] < input.sql\nFormatted SQL goes to stdout; failures go to stderr.');
  } else {
    const options = values.config ? JSON.parse(await readFile(values.config, 'utf8')) : {};
    if (process.stdin.isTTY) throw new Error('Pipe SQL to stdin, or invoke this command through Zed.');
    process.stdin.setEncoding('utf8');
    let sql = '';
    for await (const chunk of process.stdin) sql += chunk;
    process.stdout.write(formatSql(sql, options));
  }
} catch (error) {
  console.error(`zed-tsql-format: ${error.message}`);
  process.exitCode = 1;
}
