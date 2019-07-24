const { app, splayerx } = require('electron');
const { execSync } = require('child_process');

const electronVersion = app.getVersion();

function updateElectron() {
  execSync(`force_no_cache=true npm i @chiflix/electron@${electronVersion}`, { stdio: 'inherit' });
}

try {
  console.log('Checking Electron hash...');
  const expectedHash = execSync(
    `curl -L https://github.com/chiflix/electron/releases/download/v${electronVersion}/ELECTRONSLIM_VERSION_HASH.txt`,
    { encoding: 'utf-8' },
  ).trim();
  const actualHash = splayerx.getVersionHash().trim();
  console.log({ expectedHash, actualHash });
  if (expectedHash !== actualHash) updateElectron();
  process.exit(0);
} catch (ex) {
  console.error(ex);
  try {
    updateElectron();
    process.exit(0);
  } catch (updateEx) {
    console.error(updateEx);
    process.exit(1);
  }
}
