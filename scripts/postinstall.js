const { exec } = require('child_process');

const commands = [
  'npm run install-app-deps',
  'npm run lint:fix',
];

if (process.platform === 'win32') {
  commands.push('npm run rebuild:win-mouse');
}

exec(commands.join('&&'), (error) => {
  if (error) {
    throw error;
  }
});
