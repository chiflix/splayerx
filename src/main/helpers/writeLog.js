/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import electron from 'electron'; // eslint-disable-line
import winston from 'winston';

const defaultPath = path.join(electron.app.getPath('userData'), 'logs');

function fsExistsSync(path) {
  try {
    fs.accessSync(path, fs.F_OK);
  } catch (e) {
    return false;
  }
  return true;
}

const loggers = {};

function getLogger(filename) {
  if (!loggers[filename]) {
    loggers[filename] = winston.createLogger({
      format: winston.format.combine(winston.format.printf((info) => {
        if (info.stack) {
          return `${info.time} - ${info.level}: ${info.message}-${info.stack}`;
        }
        return `${info.time} - ${info.level}: ${info.message}`;
      })),
      transports: [
        new winston.transports.File({
          filename: `${defaultPath}/${filename}.log`,
        }),
      ],
    });
  }
  return loggers[filename];
}

export default function writeLog(level, log) {
  if (!fsExistsSync(defaultPath)) {
    try {
      fs.mkdirSync(defaultPath);
    } catch (err) {
      console.log(err);
    }
  }
  const date = new Date();
  const time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const logger = getLogger(time);

  logger.log({
    time: new Date().toISOString(),
    level,
    message: log.message,
    stack: log.stack,
  });
}
