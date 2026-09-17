import formatter from 'poor-mans-t-sql-formatter';
import { sqlBatches } from './batches.js';

const booleans = ['expandCommaLists', 'trailingCommas', 'spaceAfterExpandedComma',
  'expandBooleanExpressions', 'expandCaseStatements', 'expandBetweenConditions',
  'expandInLists', 'breakJoinOnSections', 'uppercaseKeywords', 'keywordStandardization'];
const integers = ['maxLineWidth', 'spacesPerTab', 'statementBreaks', 'clauseBreaks'];

export function validateOptions(options) {
  if (!options || Array.isArray(options) || typeof options !== 'object') {
    throw new Error('Formatter config must be a JSON object.');
  }
  for (const [key, value] of Object.entries(options)) {
    const valid = key === 'indent' ? typeof value === 'string' && /^[ \t]*$/.test(value)
      : booleans.includes(key) ? typeof value === 'boolean'
      : integers.includes(key) ? Number.isInteger(value) && value >= 0 && value <= 10000
      : false;
    if (!valid) throw new Error(`Invalid formatter option: ${key}`);
  }
  return options;
}

export function formatSql(sql, options = {}) {
  validateOptions(options);
  if (!sql.trim()) return sql;
  let output = '';
  for (const part of sqlBatches(sql)) {
    if (part.separator) {
      if (output && !/[\r\n]$/.test(output)) output += '\n';
      output += part.text;
    } else {
      output += formatBatch(part.text, options);
    }
  }
  return output;
}

function formatBatch(sql, options) {
  if (!sql.trim()) return sql;
  const result = formatter.formatSql(sql, { ...options, includeText: true });
  if (result.errorFound || typeof result.text !== 'string') {
    throw new Error('Poor Man’s could not parse this SQL. Document left unchanged.');
  }
  // Do not normalize line endings globally: multiline SQL literals must survive.
  return result.text;
}
