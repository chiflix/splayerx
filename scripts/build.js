const { spawn } = require('child_process');
const { join } = require('path');

const options = { shell: true, stdio: 'inherit' };
let proc;
switch (process.platform) {
  case 'darwin':
    proc = spawn(join(__dirname, 'build-mac.sh'), options);
    break;
  case 'win32':
    proc = spawn(join(__dirname, 'build-win.bat'), options);
    break;
  default:
    console.error(`Platform ${process.platform} not supported yet`);
    process.exit(0);
}
