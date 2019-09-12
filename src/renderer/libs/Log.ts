/* eslint-disable no-console */
import electron from 'electron';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import { ILog } from '@/interfaces/ILog';
import Sentry from '../../shared/sentry';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_LOG_DIRNAME } from '@/constants';

const app = electron.app || electron.remote.app;
const defaultPath = join(app.getPath(ELECTRON_CACHE_DIRNAME), DEFAULT_LOG_DIRNAME);

export default class Log implements ILog {
  private _logger: winston.Logger;

  public get logger() {
    if (this._logger) return this._logger;

    try {
      const transport = new DailyRotateFile({
        filename: `${defaultPath}/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      });

      this._logger = winston.createLogger({
        format: winston.format.combine(winston.format.printf((info) => {
          if (info.stack) {
            return `${info.time} - ${info.level}: ${info.message}-${info.stack}`;
          }
          return `${info.time} - ${info.level}: ${info.message}`;
        })),
        transports: [transport],
      });

      return this._logger;
    } catch (ex) {
      return {
        log() {
          // do nothing
        },
      };
    }
  }

  private log(label: string, level: string, message: string | Error) {
    if (level in console) console[level](label, message);
    else console.log(label, message);

    Sentry.addBreadcrumb({ message: `Log: ${label} ${level} ${message}` });

    let stack;
    if (message instanceof Error) {
      stack = message.stack;
      message = message.message;
    }

    try {
      this.logger.log({
        time: new Date().toISOString(),
        level,
        message,
        stack,
      });
    } catch (error) {
      // empty
    }
  }

  /**
   * @description 开发时输出的调试信息，不记录到日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {unknown} message 打印信息
   */
  public debug(label: string, message: unknown, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV === 'development') console.log(label, message, ...optionalParams);
  }

  /**
   * @description 记录程序状态日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {string | Error} message 打印信息
   */
  public info(label: string, message: string | Error): void {
    this.log(label, 'info', message);
  }

  /**
   * @description 记录程序状态日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {string | Error} message 打印信息
   */
  public warn(label: string, message: string | Error): void {
    this.log(label, 'warn', message);
  }

  /**
   * @description 记录逻辑和程序出错日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {(string | Error)} message 错误信息
   */
  public error(label: string, message: string | Error): void {
    this.log(label, 'error', message);
    if (process.env.NODE_ENV !== 'development') {
      Sentry.captureException(message);
    }
  }

  /**
   * @description 往sentry记录临时数据，用户排查
   * @author tanghaixiang
   * @param {string} label sentry 事件名称
   * @param {object} tags 事件标签字典，方便查找
   * @param {object} message 事件数据
   */
  public save(label: string, tags: object, message: object): void {
    if (process.env.NODE_ENV === 'development') console.log(label, message);
    Sentry.withScope((scope) => {
      Object.keys(tags).forEach((key: string) => {
        scope.setTag(key, tags[key]);
      });
      Object.keys(message).forEach((key: string) => {
        scope.setExtra(key, message[key]);
      });
      Sentry.captureMessage(label);
    });
  }
}

export const log = new Log();
