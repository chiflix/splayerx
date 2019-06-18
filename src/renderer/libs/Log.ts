import { ILog } from '@/interfaces/ILog';
import electron from 'electron';
import winston from 'winston';
import { join } from "path";
import Sentry from '../../shared/sentry';
import mkdirp from 'mkdirp';
import { checkPathExistSync, mkdirSync } from './file';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_LOG_DIRNAME } from '@/constants';

const app = electron.app || electron.remote.app;
const defaultPath = join(app.getPath(ELECTRON_CACHE_DIRNAME), DEFAULT_LOG_DIRNAME);

const loggers = {};
/** 写日志对象 */
let logger: winston.Logger

/**
 * @description 创建日志记录对象
 * @author tanghaixiang
 * @param {string} filename 日志保存的文件名
 * @returns 
 */
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
if (checkPathExistSync(defaultPath) || mkdirp.sync(defaultPath)) {
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
  /**
   * @description 记录程序状态日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {string} message 打印信息
   */
  info(label: string, message: string, stack?: string | undefined): void {
    this.log('info', message, stack);
  }
  /**
   * @description 记录逻辑和程序出错日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {(string | Error)} message 错误信息
   */
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
