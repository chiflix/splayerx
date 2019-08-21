
import { version } from '@/../../package.json';

let isWindows = false;
let isMacintosh = false;
let isLinux = false;

const isElectronRenderer = process.type === 'renderer';

// OS detection
isWindows = (process.platform === 'win32');
isMacintosh = (process.platform === 'darwin');
isLinux = (process.platform === 'linux');

export const IsWindows = isWindows;
export const IsMacintosh = isMacintosh;
export const IsLinux = isLinux;
export const IsElectronRenderer = isElectronRenderer;
export const IsBetaVersion = /beta/gi.test(version);
