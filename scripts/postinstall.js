const { exec } = require('child_process');

require('events').EventEmitter.prototype._maxListeners = 10000;

const commands = [
  'npm run lint:fix',
];

if (process.platform === 'win32') {
  commands.push('npm run install-app-deps');
  commands.push('npm run rebuild:win-mouse');
}

exec(commands.join('&&'), (error) => {
  if (error) {
    throw error;
  }
});

