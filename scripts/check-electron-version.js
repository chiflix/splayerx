const { execSync } = require('child_process');

function updateElectron(version) {
  console.log('Update Electron...');
  execSync(`npx cross-env force_no_cache=true npm i @chiflix/electron@${version}`, {
    stdio: 'inherit',
  });
}

try {
  console.log('Checking Electron hash...');
  const versionAndHash = execSync('npx electron scripts/get-electron-hash.js', {
    encoding: 'utf-8',
  }).trim();
  console.log(versionAndHash);
  const [version, actualHash] = versionAndHash.split(' ');
  const expectedHash = execSync(
    `curl -L https://github.com/chiflix/electron/releases/download/v${version}/${process.platform}_ELECTRONSLIM_VERSION_HASH.txt`,
    { encoding: 'utf-8' },
  ).trim();
  console.log({ expectedHash, actualHash });
  if (expectedHash !== actualHash) updateElectron(version);
  process.exit(0);
} catch (ex) {
  console.error(ex);
  process.exit(1);
}
