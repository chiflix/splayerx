export async function setAsDefaultApp() {
  if (process.platform === 'darwin') {
    const { default: code } = await import('!raw-loader!./python/setAsDefaultAppForMac.py');
    require('child_process').spawn('python', ['-c', code]);
  }
}

export default {
  setAsDefaultApp,
};
