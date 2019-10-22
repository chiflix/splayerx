/* eslint-disable no-console */
import { ILog } from '@/interfaces/ILog';
import Sentry from '../../shared/sentry';

export default class Log implements ILog {
  private log(label: string, level: string, message: string | Error) {
    if (level in console) console[level](label, message);
    else console.log(label, message);

    Sentry.addBreadcrumb({ message: `Log: ${label} ${level} ${message}` });
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
