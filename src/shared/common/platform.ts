
let isWindows = false;
let isMacintosh = false;
let isLinux = false;

// OS detection
isWindows = (process.platform === 'win32');
isMacintosh = (process.platform === 'darwin');
isLinux = (process.platform === 'linux');

export const IsWindows = isWindows;
export const IsMacintosh = isMacintosh;
export const IsLinux = isLinux;
export const IsElectronRenderer = isElectronRenderer;
