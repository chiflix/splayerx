import path from 'path';
import fs from 'fs';
import winston from 'winston';

const electron = require('electron');
const app = electron.remote.app || electron.app;
const defaultPath = path.join(app.getPath('userData'), 'logs');
function fsExistsSync(path) {
  try {
    fs.accessSync(path, fs.F_OK);
  } catch (e) {
    return false;
  }
  return true;
}
if (!fsExistsSync(defaultPath)) {
  try {
    fs.mkdirSync(defaultPath);
  } catch (err) {
    console.log(err);
  }
}
const date = new Date();
const time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const logger = winston.createLogger({
  format: winston.format.combine(winston.format.printf(info => (info.stack ? `${info.time} - ${info.level}: ${info.message}-${info.stack}` : `${info.time} - ${info.level}: ${info.message}`))),
  transports: [
    new winston.transports.File({ filename: `${defaultPath}/${time}.log` }),
  ],
});
class log {
  static add(level, message) {
    if (message.stack) {
      logger.log({
        time: new Date().toISOString(),
        level,
        message: message.message,
        stack: message.stack,
      });
    } else {
      logger.log({
        time: new Date().toISOString(),
        level,
        message,
      });
      if (message.includes('Failed to open file')) {
        this.$store.dispatch('addMessages', {
          type: 'error',
          title: this.$t('errorFile.title'),
          content: this.$t('errorFile.content'),
          dismissAfter: 10000,
        });
      }
    }
  }
}

export default log;
