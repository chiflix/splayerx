const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

require('events').EventEmitter.prototype._maxListeners = 10000;

const commands = [
  'node scripts/gen-electron-builder-config.js',
  'npm run lint:fix',
  'npm run install-app-deps',
];

exec(commands.join('&&'), (error, stdout) => {
  if (error) throw error;
  console.log(stdout);
});
