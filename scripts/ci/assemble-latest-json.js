#!/usr/bin/env node
// CI-OWNED: assembles latest.json from .sig files attached to the draft
// release for $TAG, then uploads it to the same release. Asserts both platform
// signatures are present and non-empty. Do NOT run this locally — it is the
// canonical source of latest.json consumed by the auto-updater.

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tag = process.env.TAG;
const version = process.env.VERSION;
const owner = 'Gudiii05';
const repo = 'pulp';

if (!tag || !version) {
  console.error('TAG and VERSION env vars are required.');
  process.exit(1);
}

const WIN_ASSET = `Pulp_${version}_x64-setup.exe`;
const LINUX_ASSET = `pulp_${version}_amd64.AppImage`;
const WIN_SIG = `${WIN_ASSET}.sig`;
const LINUX_SIG = `${LINUX_ASSET}.sig`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulp-sig-'));

function downloadAndRead(asset) {
  console.log(`Downloading ${asset} from release ${tag}...`);
  execSync(
    `gh release download ${tag} --pattern ${JSON.stringify(asset)} --dir ${JSON.stringify(tmpDir)}`,
    { stdio: 'inherit' },
  );
  const localPath = path.join(tmpDir, asset);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Failed to download ${asset} — file not found at ${localPath}`);
  }
  const content = fs.readFileSync(localPath, 'utf8').trim();
  if (!content) {
    throw new Error(`${asset} is empty — signing must have failed in the build job.`);
  }
  return content;
}

const winSignature = downloadAndRead(WIN_SIG);
const linuxSignature = downloadAndRead(LINUX_SIG);

const notesPath = path.join('scripts', `release-notes-${version}.txt`);
let notes = `Pulp ${tag}`;
if (fs.existsSync(notesPath)) {
  notes = fs.readFileSync(notesPath, 'utf8');
} else {
  console.warn(`WARNING: ${notesPath} not found — using default notes.`);
}

const pubDate = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const baseUrl = `https://github.com/${owner}/${repo}/releases/download/${tag}`;

const latest = {
  version,
  notes,
  pub_date: pubDate,
  platforms: {
    'windows-x86_64': {
      signature: winSignature,
      url: `${baseUrl}/${WIN_ASSET}`,
    },
    'linux-x86_64': {
      signature: linuxSignature,
      url: `${baseUrl}/${LINUX_ASSET}`,
    },
  },
};

fs.writeFileSync('latest.json', JSON.stringify(latest, null, 2) + '\n');
console.log('Assembled latest.json:');
console.log(JSON.stringify(latest, null, 2));

console.log(`Uploading latest.json to release ${tag}...`);
execSync(`gh release upload ${tag} latest.json --clobber`, { stdio: 'inherit' });
console.log('Done.');
