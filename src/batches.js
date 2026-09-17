// Only recognize sqlcmd's line-oriented GO directives outside quoted text and
// comments. SQL Server permits nested block comments and escaped quote closers.
function codeOnLine(line, state) {
  let code = state.quote ? '?' : '';
  for (let i = 0; i < line.length; i++) {
    const character = line[i];
    const pair = line.slice(i, i + 2);
    if (state.blockDepth) {
      if (pair === '/*') { state.blockDepth++; i++; }
      else if (pair === '*/') { state.blockDepth--; i++; }
    } else if (state.quote) {
      if (character === state.quote) {
        if (line[i + 1] === state.quote) i++;
        else state.quote = null;
      }
    } else if (pair === '--') {
      break;
    } else if (pair === '/*') {
      state.blockDepth++;
      code += ' ';
      i++;
    } else if (character === "'" || character === '"' || character === '[') {
      state.quote = character === '[' ? ']' : character;
      code += '?';
    } else {
      code += character;
    }
  }
  return code.trim();
}

export function* sqlBatches(sql) {
  const state = { quote: null, blockDepth: 0 };
  let batchStart = 0;
  for (const match of sql.matchAll(/[^\r\n]*(?:\r\n|\r|\n|$)/g)) {
    const line = match[0];
    if (!line) continue;
    const startsInCode = !state.quote && !state.blockDepth;
    const code = codeOnLine(line, state);
    if (!/^GO(?:[ \t]+[0-9]+)?$/i.test(code)) continue;
    if (!startsInCode || state.quote || state.blockDepth) {
      throw new Error('Cannot safely format a GO directive spanning a block comment. Document left unchanged.');
    }
    yield { text: sql.slice(batchStart, match.index), separator: false };
    yield { text: line, separator: true };
    batchStart = match.index + line.length;
  }
  yield { text: sql.slice(batchStart), separator: false };
}
