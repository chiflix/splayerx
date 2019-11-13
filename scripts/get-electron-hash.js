const path = require('path');
const fs = require('fs');
const { splayerx } = require('electron');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')));
const electronVersion = packageJson['devDependencies']['@chiflix/electron'];
const actualHash = splayerx.getVersionHash().trim();

process.stdout.write(`${electronVersion} ${actualHash}`);
process.exit(0);
