import { spawn } from 'node:child_process';
import { constants } from 'node:os';
import { validateProfile } from './profiles.js';

export function queryCommand(profile, file, environment = process.env) {
  validateProfile(profile);
  // sqlcmd environment defaults must not silently override the selected profile.
  const env = Object.fromEntries(Object.entries(environment).filter(([key]) => !key.toUpperCase().startsWith('SQLCMD')));
  // Go sqlcmd reads UTF-8 and rejects the ODBC-only -f code-page option.
  const args = ['-S', profile.server, '-d', profile.database, '-b', '-r', '1', '-W', '-s', '|'];
  if (profile.auth === 'integrated') args.push('-E');
  else {
    args.push('-U', profile.user);
    if (profile.passwordEnv) {
      const password = environment[profile.passwordEnv];
      if (!password) throw new Error(`Set ${profile.passwordEnv} before connecting.`);
      env.SQLCMDPASSWORD = password;
    }
  }
  if (profile.trustServerCertificate) args.push('-C');
  args.push('-i', file);
  return { args, env };
}

export function runQuery(executable, command) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, command.args, { env: command.env, stdio: 'inherit', shell: false });
    let interrupted = false;
    let forceKill;
    const cleanup = () => {
      clearTimeout(forceKill);
      process.off('SIGINT', interrupt);
      process.off('SIGTERM', interrupt);
    };
    const interrupt = () => {
      if (interrupted) {
        child.kill('SIGKILL');
        return;
      }
      interrupted = true;
      child.kill('SIGINT');
      // sqlcmd may cancel a query without exiting. Do not leave the task stuck.
      forceKill = setTimeout(() => child.kill('SIGKILL'), 2000);
      forceKill.unref();
    };
    process.on('SIGINT', interrupt);
    process.on('SIGTERM', interrupt);
    child.once('error', error => {
      cleanup();
      reject(error.code === 'ENOENT' ? new Error('sqlcmd not found. Install it or pass --sqlcmd /absolute/path/to/sqlcmd.') : error);
    });
    child.once('exit', (code, signal) => {
      cleanup();
      resolve(interrupted ? 130 : code ?? 128 + (constants.signals[signal] || 1));
    });
  });
}
