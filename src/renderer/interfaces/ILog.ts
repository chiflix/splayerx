
export interface ILog {
  /**
   * @description 记录程序状态日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {string} message 打印信息
   */
  info(label: string, message: string): void
  /**
   * @description 记录逻辑和程序出错日志
   * @author tanghaixiang
   * @param {string} label 类名或者文件名
   * @param {(string | Error)} message 错误信息
   */
  error(label: string, message: string | Error): void
}