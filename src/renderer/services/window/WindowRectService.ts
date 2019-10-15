import { ipcRenderer } from 'electron';
import { IWindowRectRequest } from '@/interfaces/IWindowRectRequest';

/** 最小窗口尺寸[320, 180]
 * @constant
 * @type number[]
 */
const MINSIZE = [320, 180];

/** boundX
 * @constant
 * @type number[]
 */
const getScreenRect = () => [
  window.screen.availLeft, window.screen.availTop,
  window.screen.availWidth, window.screen.availHeight,
];

/** landing view 尺寸和坐标
 * @constant
 * @type number[]
 */
const LANDINGVIEWRECT = [720, 405].concat([
  (window.screen.width - 720) / 2,
  (window.screen.height - 400) / 2,
]);

export default class WindowRectService implements IWindowRectRequest {
  /**
   * @description 计算新的窗口大小
   * @author tanghaixiang
   * @param {number[]} minSize
   * @param {number[]} maxSize
   * @param {number[]} videoSize
   * @param {boolean} [videoExisted]
   * @param {number[]} [screenSize]
   * @returns {number[]} 返回最新的窗口宽和高
   */
  private calculateWindowSize(
    minSize: number[],
    maxSize: number[],
    videoSize: number[],
    videoExisted?: boolean,
    screenSize?: number[],
  ): number[] {
    let result = videoSize;
    const getRatio = (size: number[]) => size[0] / size[1];
    const setSizeByHeight = (size: number[]) => [size[1] * getRatio(videoSize), size[1]];
    const setSizeByWidth = (size: number[]) => [size[0], size[0] / getRatio(videoSize)];
    const biggerSize = (
      size: number[],
      diffedSize: number[],
    ) => size.some((value, index) => value >= diffedSize[index]);
    const biggerWidth = (size: number[], diffedSize: number[]) => size[0] >= diffedSize[0];
    const biggerRatio = (size1: number[], size2: number[]) => getRatio(size1) > getRatio(size2);
    if (videoExisted && biggerWidth(result, maxSize)) {
      result = setSizeByWidth(maxSize);
    }
    const realMaxSize = videoExisted && screenSize ? screenSize : maxSize;
    if (biggerSize(result, realMaxSize)) {
      result = biggerRatio(result, realMaxSize)
        ? setSizeByWidth(realMaxSize) : setSizeByHeight(realMaxSize);
    }
    if (biggerSize(minSize, result)) {
      result = biggerRatio(minSize, result)
        ? setSizeByWidth(minSize) : setSizeByHeight(minSize);
    }
    return result.map(Math.round);
  }

  /**
   * @description 根据窗口中点进行缩放，计算出新视频的左上点的位置，并当视频超出当前屏幕边缘时做回弹处理
   * @author tanghaixiang
   * @param {number[]} currentRect
   * @param {number[]} windowRect
   * @param {number[]} newSize
   * @returns {number[]} 返回最新的窗口位置
   */
  private calculateWindowPosition(
    currentRect: number[],
    newSize: number[],
    windowRect: number[],
  ): number[] {
    const tempRect = currentRect.slice(0, 2)
      .map((value, index) => value + (currentRect.slice(2, 4)[index] / 2))
      .map((value, index) => Math.floor(value - (newSize[index] / 2)))
      .concat(newSize);
    const alterPos = (
      boundX: number,
      boundLength: number,
      videoX: number,
      videoLength: number,
    ) => {
      if (videoX < boundX) return boundX;
      if (videoX + videoLength > boundX + boundLength) {
        return (boundX + boundLength) - videoLength;
      }
      return videoX;
    };
    return [
      alterPos(windowRect[0], windowRect[2], tempRect[0], tempRect[2]),
      alterPos(windowRect[1], windowRect[3], tempRect[1], tempRect[3]),
    ];
  }

  /**
   * @description 根据是否全屏和旋转角度来计算窗口新的大小和位置
   * @author tanghaixiang
   * @param {boolean} fullScreen
   * @param {string} [whichView]
   * @param {number} [windowAngle]
   * @param {number} [lastWindowAngle]
   * @param {number[]} [lastWindowSize]
   * @param {number[]} [windowPosition]
   * @returns {number[]} 返回新的窗口大小和位置
   */
  public uploadWindowBy( // eslint-disable-line complexity
    fullScreen: boolean,
    whichView?: string,
    windowAngle?: number,
    lastWindowAngle?: number,
    lastWindowSize?: number[],
    windowPosition?: number[],
    isFullScreen?: boolean,
  ): number[] {
    let newRect: number[] = [];
    ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [fullScreen]);
    if (!fullScreen && whichView === 'landing-view') {
      if (lastWindowSize && windowPosition && isFullScreen === false) {
        const oldRect = windowPosition.concat(lastWindowSize);
        newRect = this.calculateWindowRect(LANDINGVIEWRECT.slice(0, 2), false, oldRect);
      } else {
        ipcRenderer.send('callMainWindowMethod', 'setSize', LANDINGVIEWRECT.slice(0, 2));
        // ipcRenderer.send('callMainWindowMethod', 'setPosition', LANDINGVIEWRECT.slice(2, 4));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
        newRect = LANDINGVIEWRECT;
      }
    } else if (!fullScreen && lastWindowSize && windowPosition
      && (((windowAngle === 90 || windowAngle === 270)
        && (lastWindowAngle === 0 || lastWindowAngle === 180))
        || (!(windowAngle === 90 || windowAngle === 270)
          && (lastWindowAngle === 90 || lastWindowAngle === 270)))) {
      const videoSize = [lastWindowSize[1], lastWindowSize[0]];
      const newVideoSize = this
        .calculateWindowSize(MINSIZE, getScreenRect().slice(2, 4), videoSize);
      // 退出全屏，计算pos依赖旧窗口大小，现在设置旧窗口大小为新大小的反转，
      // 这样在那里全屏，退出全屏后窗口还在那个位置。
      const newPosition = this.calculateWindowPosition(
        windowPosition.concat([newVideoSize[1], newVideoSize[0]]),
        newVideoSize,
        getScreenRect(),
      );
      newRect = newPosition.concat(newVideoSize);
      ipcRenderer.send('callMainWindowMethod', 'setSize', newRect.slice(2, 4));
      ipcRenderer.send('callMainWindowMethod', 'setPosition', newRect.slice(0, 2));
      ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [newRect.slice(2, 4)[0] / newRect.slice(2, 4)[1]]);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
    }
    return newRect;
  }

  /**
   * @description 正常模式下计算新的窗口大小和位置
   * @author tanghaixiang
   * @param {number[]} videoSize
   * @param {boolean} videoExisted
   * @param {number[]} oldRect
   * @param {number[]} [maxSize]
   * @returns {number[]} 返回新的窗口大小和位置
   */
  public calculateWindowRect(
    videoSize: number[],
    videoExisted: boolean,
    oldRect: number[],
    maxSize?: number[],
    minSize?: number[],
    screenRect?: number[],
  ): number[] {
    if (!maxSize) {
      maxSize = getScreenRect().slice(2, 4);
    }
    screenRect = screenRect || getScreenRect();
    if (!minSize) minSize = MINSIZE;
    const [newWidth, newHeight] = this.calculateWindowSize(
      minSize, maxSize, videoSize, videoExisted, screenRect.slice(2, 4),
    );
    const [newLeft, newTop] = this.calculateWindowPosition(
      oldRect, [newWidth, newHeight], screenRect,
    );
    const rect = [newLeft, newTop, newWidth, newHeight];
    ipcRenderer.send('callMainWindowMethod', 'setSize', rect.slice(2, 4));
    ipcRenderer.send('callMainWindowMethod', 'setPosition', rect.slice(0, 2));
    ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [rect.slice(2, 4)[0] / rect.slice(2, 4)[1]]);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
    return rect;
  }

  /**
   * @description 计算视频缩放大小
   * @author tanghaixiang
   * @param {boolean} fullScreen
   * @param {number} windowAngle
   * @param {number} videoRatio
   * @param {number} [windowRatio]
   * @returns {number} 返回视频缩放大小
   */
  public calculateWindowScaleBy(
    fullScreen: boolean,
    windowAngle: number,
    videoRatio: number,
    windowRatio?: number,
  ): number {
    let result = 0;
    if (!windowRatio) {
      windowRatio = window.screen.width / window.screen.height;
    }
    if ((windowAngle === 90 || windowAngle === 270) && fullScreen) {
      result = windowRatio < 1 ? videoRatio : 1 / videoRatio;
    } else if (windowAngle === 90 || windowAngle === 270) {
      result = videoRatio < 1 ? 1 / videoRatio : videoRatio;
    } else {
      result = 1;
    }
    return result;
  }
}

export const windowRectService = new WindowRectService();
