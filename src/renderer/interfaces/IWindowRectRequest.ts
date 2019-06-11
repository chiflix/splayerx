
export interface IWindowRectRequest {
  /**
   * @description 正常模式下计算新的窗口大小和位置
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {number[]} videoSize
   * @param {boolean} videoExisted
   * @param {number[]} position
   * @param {number[]} maxSize
   * @returns {number[]} 返回新的窗口大小和位置
   * @memberof IWindowRectRequest
   */
  calculateWindowRect(videoSize: number[], videoExisted: boolean, position: number[], maxSize: number[]): number[]
  /**
   * @description 计算视频缩放大小
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {boolean} fullScreen
   * @param {number} windowAngle
   * @param {number} videoRatio
   * @param {number} [windowRatio]
   * @returns {number} 返回视频缩放大小
   * @memberof IWindowRectRequest
   */
  calculateWindowScaleBy(fullScreen: boolean, windowAngle: number, videoRatio: number, windowRatio?: number): number
  /**
   * @description 根据是否全屏和旋转角度来计算窗口新的大小和位置
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {boolean} fullScreen
   * @param {string} [which]
   * @param {number} [windowAngle]
   * @param {number} [lastWindowAngle]
   * @param {number[]} [lastWindowSize]
   * @param {number[]} [windowPosition]
   * @returns {number[]} 返回新的窗口大小和位置
   * @memberof IWindowRectRequest
   */
  uploadWindowBy(fullScreen: boolean, which?: string, windowAngle?: number, lastWindowAngle?: number, lastWindowSize?: number[], windowPosition?: number[]): number[]
}