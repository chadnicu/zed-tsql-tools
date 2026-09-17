import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';

export function defaultProfilesPath() {
  const base = process.platform === 'win32'
    ? process.env.APPDATA || join(homedir(), 'AppData', 'Roaming')
    : process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(base, 'zed-mssql-tools', 'profiles.json');
}

function validateProfileName(name) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name)) {
    throw new Error('Profile names must use letters, digits, underscores or hyphens.');
  }
}

export function validateProfile(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Invalid connection profile.');
  for (const key of Object.keys(profile)) {
    if (!['server', 'database', 'user', 'passwordEnv', 'auth', 'trustServerCertificate'].includes(key)) {
      throw new Error(`Unknown profile field: ${JSON.stringify(key)}`);
    }
  }
  for (const key of ['server', 'database']) {
    if (typeof profile[key] !== 'string' || !profile[key].trim() || profile[key].startsWith('-') || /[\x00-\x1f\x7f]/.test(profile[key])) {
      throw new Error(`Profile requires a valid ${key}.`);
    }
  }
  if (!['sql', 'integrated'].includes(profile.auth)) throw new Error('Auth must be sql or integrated.');
  if (profile.auth === 'sql' && (typeof profile.user !== 'string' || !profile.user.trim() || /^-|[\x00-\x1f\x7f]/.test(profile.user))) {
    throw new Error('SQL authentication requires a user.');
  }
  if (profile.auth === 'integrated' && (profile.user !== undefined || profile.passwordEnv !== undefined)) {
    throw new Error('Integrated authentication does not use user or password-env.');
  }
  if (profile.passwordEnv !== undefined && (typeof profile.passwordEnv !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(profile.passwordEnv))) {
    throw new Error('Invalid password environment variable name.');
  }
  if (profile.trustServerCertificate !== undefined && typeof profile.trustServerCertificate !== 'boolean') {
    throw new Error('trustServerCertificate must be boolean.');
  }
  return profile;
}

export async function readProfiles(path) {
  let text;
  try { text = await readFile(path, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
  const profiles = JSON.parse(text);
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) throw new Error('Profiles file must be a JSON object.');
  for (const [name, profile] of Object.entries(profiles)) {
    validateProfileName(name);
    validateProfile(profile);
  }
  return profiles;
}

export async function addProfile(path, name, profile) {
  validateProfileName(name);
  validateProfile(profile);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  // Serialize writers; never overwrite a concurrently added profile.
  const lockPath = `${path}.lock`;
  try { await writeFile(lockPath, '', { flag: 'wx', mode: 0o600 }); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Profiles file is locked: ${lockPath}`);
    throw error;
  }
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    const profiles = await readProfiles(path);
    if (Object.hasOwn(profiles, name)) throw new Error(`Profile already exists: ${name}`);
    Object.defineProperty(profiles, name, { value: profile, enumerable: true });
    await writeFile(temp, `${JSON.stringify(profiles, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
    await rm(lockPath, { force: true });
  }
}
