const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

require('events').EventEmitter.prototype._maxListeners = 10000;

const commands = [
  'npx rimraf node_modules/**/.git',
  'npm run lint:fix',
];

if (process.platform === 'win32') {
  commands.push('npm run install-app-deps');
  commands.push('npm run rebuild:win-mouse');
}

exec(commands.join('&&'), (error, stdout) => {
  if (error) throw error;
  console.log(stdout);
});

// TODO: make a PR to electron-builder project
fs.writeFileSync(
  path.join(__dirname, '../node_modules/app-builder-lib', 'templates/appx/appxmanifest.xml'),
  fs.readFileSync(path.join(__dirname, 'patch/appx', 'appxmanifest.xml')),
);
fs.writeFileSync(
  path.join(__dirname, '../node_modules/app-builder-lib', 'out/targets/AppxTarget.js'),
  fs.readFileSync(path.join(__dirname, 'patch/appx', 'AppxTarget.js')),
);
fs.writeFileSync(
  path.join(__dirname, '../node_modules/app-builder-lib', 'out/electron/electronMac.js'),
  fs.readFileSync(path.join(__dirname, 'patch/mac', 'electronMac.js')),
);
