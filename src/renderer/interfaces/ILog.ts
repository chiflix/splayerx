export interface ILog {
  /**
   * @description 记录程序状态日志
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} tag
   * @param {Error} content
   * @memberof ILog
   */
  info(tag: string, content: Error): void
  /**
   * @description 记录逻辑和程序出错日志
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} tag
   * @param {Error} content
   * @memberof ILog
   */
  error(tag: string, content: Error): void
}