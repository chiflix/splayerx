
export interface ILog {
  /**
   * @description 记录程序状态日志
   * @author tanghaixiang@xindong.com
   * @date 2019-06-14
   * @param {string} label
   * @param {string} message
   * @param {string} stack
   * @memberof ILog
   */
  info(label: string, message: string): void
  /**
   * @description 记录逻辑和程序出错日志
   * @author tanghaixiang@xindong.com
   * @date 2019-06-14
   * @param {string} label
   * @param {string} message
   * @param {string} stack
   * @memberof ILog
   */
  error(label: string, message: string | Error): void
}