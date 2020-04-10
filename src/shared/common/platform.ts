import { version as packageVersion } from '@/../../package.json';

// OS detection
export const version = packageVersion;
export const isWindows = (process.platform === 'win32');
export const isWindowsExE = (process.platform === 'win32' && !process.windowsStore);
export const isMacintosh = (process.platform === 'darwin');
export const isMacintoshDMG = (process.platform === 'darwin' && !process.mas);
export const isLinux = (process.platform === 'linux');
export const isElectronRenderer = (process.type === 'renderer');
export const isBetaVersion = /beta/gi.test(version);
