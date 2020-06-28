import { app } from 'electron';
import path from 'path';
import mkdirp from 'mkdirp';

try {
  let customUserDataDir = app.commandLine.getSwitchValue('user-data-dir');
  if (customUserDataDir) {
    if (!path.isAbsolute(customUserDataDir)) {
      customUserDataDir = path.join(path.dirname(process.argv0), customUserDataDir);
    }
    mkdirp.sync(customUserDataDir);
    app.setPath('userData', customUserDataDir);
  }
} catch (ex) {
  console.error(ex);
}
