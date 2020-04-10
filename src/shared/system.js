import { shell } from 'electron';
import { getAllValidExtensions } from './utils';

async function spawn(...args) {
  return new Promise((resolve, reject) => {
    const proc = require('child_process').spawn(...args);
    proc.stdout.on('data', data => console.log(`stdout: ${data}`)); // eslint-disable-line no-console
    proc.stderr.on('data', data => console.warn(`stderr: ${data}`));
    proc.on('close', code => (code === 0 ? resolve(code) : reject(code)));
  });
}

export async function setAsDefaultApp() {
  const exts = getAllValidExtensions();
  if (process.platform === 'darwin') {
    let { default: code } = await import('raw-loader!./python/setAsDefaultAppForMac.py');
    code = code.replace('$EXTS', exts.map(ext => `'${ext}'`).join(', '));
    await spawn('python', ['-c', code]);
  } else if (process.platform === 'win32') {
    // for Windows 10
    try {
      if (shell.openExternal('ms-settings:defaultapps', { activate: true })) return;
    } catch (ex) {
      //
    }
    // for old versions
    let cmd = process.argv[0];
    cmd = `${cmd} %1`;
    await spawn('reg', ['add', 'HKCU\\Software\\Classes\\Splayer', '/f', '/d', '"A Modern Media Player with Smart Translation"']);
    await spawn('reg', ['add', 'HKCU\\Software\\Classes\\Splayer\\shell\\Open\\Command', '/f', '/d', cmd]);
    await Promise.all(exts.map(ext => Promise.all([
      spawn('reg', ['add', `HKCU\\Software\\Classes\\.${ext}`, '/f', '/d', 'Splayer']),
      spawn('reg', ['add', `HKCU\\Software\\Classes\\.${ext}\\OpenWithProgids`, '/f', '/d', 'Splayer']),
    ])));
  }
}

export default {
  setAsDefaultApp,
};
