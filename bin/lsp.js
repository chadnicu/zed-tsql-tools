#!/usr/bin/env node
import { createConnection, TextDocuments, TextDocumentSyncKind, ResponseError, ErrorCodes } from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { formatSql, validateOptions } from '../src/formatter.js';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const connection = createConnection(process.stdin, process.stdout);
const documents = new TextDocuments(TextDocument);
let options = {};

connection.onInitialize(params => {
  try {
    options = validateOptions(params.initializationOptions?.formatter ?? {});
  } catch (error) {
    return new ResponseError(ErrorCodes.InvalidParams, error.message);
  }
  return { capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    documentFormattingProvider: true,
  }, serverInfo: { name: 'poor-mans-tsql-lsp', version } };
});

connection.onDocumentFormatting(params => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return new ResponseError(ErrorCodes.InvalidParams, 'Document is not open.');
  try {
    const text = document.getText();
    const tabSize = params.options.tabSize;
    if (!Number.isInteger(tabSize) || tabSize < 1 || tabSize > 32) {
      return new ResponseError(ErrorCodes.InvalidParams, 'tabSize must be between 1 and 32.');
    }
    const formatted = formatSql(text, {
      indent: params.options.insertSpaces ? ' '.repeat(tabSize) : '\t',
      ...options,
    });
    if (formatted === text) return [];
    return [{ range: { start: { line: 0, character: 0 }, end: document.positionAt(text.length) }, newText: formatted }];
  } catch (error) {
    return new ResponseError(ErrorCodes.InternalError, error.message);
  }
});

documents.listen(connection);
connection.listen();
