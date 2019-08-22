
import { version } from '@/../../package.json';

// OS detection
export const isWindows = (process.platform === 'win32');
export const isWindowsExE = (process.platform === 'win32' && !process.windowsStore);
export const isMacintosh = (process.platform === 'darwin');
export const isLinux = (process.platform === 'linux');
export const isElectronRenderer = (process.type === 'renderer');
export const isBetaVersion = /beta/gi.test(version);
