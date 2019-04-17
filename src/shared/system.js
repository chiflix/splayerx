export async function setAsDefaultApp() {
  if (process.platform === 'darwin') {
    const { default: code } = await import('!raw-loader!./python/setAsDefaultAppForMac.py');
    require('child_process').spawn('python', ['-c', code]);
  } else if (process.platform === 'win32') {
    const { associateExeForFile } = require('windows-registry').utils;
    const exe = process.isPackaged
      ? process.argv[0]
      : process.argv.filter((a, i) => i === 0 || a.startsWith('-') || a.startsWith('/')).join(' ');
    const exts = ['mp4', 'avi', 'mkv', 'rmvb', 'wmv', 'flv', 'ogg', 'ogv'];
    exts.forEach((ext) => {
      associateExeForFile('Splayer', 'A Modern Media Player with Smart Translation', '', `${exe} %1`, `.${ext}`);
    });
  }
}

export default {
  setAsDefaultApp,
};
