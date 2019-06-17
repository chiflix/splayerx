import { ILog } from '@/interfaces/ILog';
import electron from 'electron';
import winston from 'winston';
import { join } from "path";
import Sentry from '../../shared/sentry';
import { checkPathExistSync, mkdirSync } from './file';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_LOG_DIRNAME } from '@/constants';

const app = electron.app || electron.remote.app;
const defaultPath = join(app.getPath(ELECTRON_CACHE_DIRNAME), DEFAULT_LOG_DIRNAME);

const loggers = {};
let logger: winston.Logger

function getLogger(filename: string) {
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

const date = new Date();
const time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
if (checkPathExistSync(defaultPath) || mkdirSync(defaultPath)) {
  logger = getLogger(time)
}
export default class Log implements ILog {
  private log(level: string, message: string, stack?: string | undefined) {
    try {
      logger.log({
        time: new Date().toISOString(),
        level,
        message: message,
        stack: stack
      });
    } catch (error) {
      const date = new Date();
      const time = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      logger = getLogger(time);
    }
  }
  info(label: string, message: string): void
  info(label: string, message: string, stack: string | undefined): void
  info(label: string, message: string, stack?: string | undefined): void {
    this.log('info', message, stack);
  }
  error(label: string, message: string | Error): void {
    if (message instanceof Error) {
      this.log('error', message.message, message.stack);
    } else {
      this.log('error', message);
    }
    if (process.env.NODE_ENV !== 'development') {
      Sentry.captureException(message);
    }
  }
}

export const log = new Log();
