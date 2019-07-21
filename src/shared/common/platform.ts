
let isWindows = false;
let isMacintosh = false;
let isLinux = false;

const isElectronRenderer = (typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.electron !== 'undefined' && process.type === 'renderer');

// OS detection
if (typeof navigator === 'object' && !isElectronRenderer) {
  const userAgent = navigator.userAgent;
  isWindows = userAgent.indexOf('Windows') >= 0;
  isMacintosh = userAgent.indexOf('Macintosh') >= 0;
  isLinux = userAgent.indexOf('Linux') >= 0;
} else if (typeof process === 'object') {
  isWindows = (process.platform === 'win32');
  isMacintosh = (process.platform === 'darwin');
  isLinux = (process.platform === 'linux');
}
export const IsWindows = isWindows;
export const IsMacintosh = isMacintosh;
export const IsLinux = isLinux;
export const IsElectronRenderer = isElectronRenderer;
