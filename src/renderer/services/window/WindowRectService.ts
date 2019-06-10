import { IWindowRectRequest } from "@/interfaces/IWindowRectRequest";
import { ipcRenderer } from "electron";

/** 最小窗口尺寸[320, 180]
 * @constant
 * @type number[]
 */
const MINSIZE = [320, 180];

/** boundX
 * @constant
 * @type number[]
 */
const WINDOWRECT = [
  window.screen.availLeft, window.screen.availTop,
  window.screen.availWidth, window.screen.availHeight,
];

/** landing view 尺寸和坐标
 * @constant
 * @type number[]
 */
const LANDINGVIEWRECT = [720, 405].concat([
  (window.screen.width - 720) / 2,
  (window.screen.height - 400) / 2
]);

export default class WindowRectService implements IWindowRectRequest {
  private calculateWindowSize(minSize: number[], maxSize: number[], videoSize: number[]): number[];
  private calculateWindowSize(minSize: number[], maxSize: number[], videoSize: number[], videoExisted: boolean, screenSize: number[]): number[];
  private calculateWindowSize(minSize: number[], maxSize: number[], videoSize: number[], videoExisted?: boolean, screenSize?: number[]): number[] {
    let result = videoSize;
    const getRatio = (size: number[]) => size[0] / size[1];
    const setWidthByHeight = (size: any[] | number[]) => [size[1] * getRatio(videoSize), size[1]];
    const setHeightByWidth = (size: number[]) => [size[0], size[0] / getRatio(videoSize)];
    const biggerSize = (size: number[], diffedSize: number[]) =>
      size.some((value, index) => value >= diffedSize[index]);
    const biggerWidth = (size: number[], diffedSize: number[]) => size[0] >= diffedSize[0];
    const biggerRatio = (size1: number[], size2: number[]) => getRatio(size1) > getRatio(size2);
    if (videoExisted && biggerWidth(result, maxSize)) {
      result = setHeightByWidth(maxSize);
    }
    const realMaxSize = videoExisted && screenSize ? screenSize : maxSize;
    if (biggerSize(result, realMaxSize)) {
      result = biggerRatio(result, realMaxSize) ?
        setHeightByWidth(realMaxSize) : setWidthByHeight(realMaxSize);
    }
    if (biggerSize(minSize, result)) {
      result = biggerRatio(minSize, result) ?
        setHeightByWidth(minSize) : setWidthByHeight(minSize);
    }
    return result.map(Math.round);
  }

  private calculateWindowPosition(currentRect: number[], windowRect: number[], newSize: number[]) {
    const tempRect = currentRect.slice(0, 2)
      .map((value, index) => Math.floor(value + (currentRect.slice(2, 4)[index] / 2)))
      .map((value, index) => Math.floor(value - (newSize[index] / 2))).concat(newSize);
    return ((windowRect, tempRect) => {
      const alterPos = (boundX: number, boundLength: number, videoX: number, videoLength: number) => {
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
    })(windowRect, tempRect);
  }

  public uploadWindowBy(fullScreen: boolean, whichView?: string, windowAngle?: number, lastWindowAngle?: number, lastWindowSize?: number[], windowPosition?: number[]): number[] {
    let newRect: number[] = [];
    ipcRenderer.send('callMainWindowMethod', 'setFullScreen', [fullScreen]);
    if (!fullScreen && whichView === 'landing-view') {
      ipcRenderer.send('callMainWindowMethod', 'setSize', LANDINGVIEWRECT.slice(0, 2));
      ipcRenderer.send('callMainWindowMethod', 'setPosition', LANDINGVIEWRECT.slice(2, 4));
      newRect = LANDINGVIEWRECT;
    } else if (!fullScreen && lastWindowSize && windowPosition &&
      ((windowAngle === 90 || windowAngle === 270) && (lastWindowAngle === 0 || lastWindowAngle === 180) ||
        !(windowAngle === 90 || windowAngle === 270) && (lastWindowAngle === 90 || lastWindowAngle === 270))) {
      const videoSize = [lastWindowSize[1], lastWindowSize[0]];
      const newVideoSize = this.calculateWindowSize(MINSIZE, WINDOWRECT.slice(2, 4), videoSize);
      // 退出全屏，计算pos依赖旧窗口大小，现在设置旧窗口大小为新大小的反转，
      // 这样在那里全屏，退出全屏后窗口还在那个位置。
      const newPosition = this.calculateWindowPosition(
        windowPosition.concat([newVideoSize[1], newVideoSize[0]]),
        WINDOWRECT,
        newVideoSize,
      );
      newRect = newPosition.concat(newVideoSize);
      ipcRenderer.send('callMainWindowMethod', 'setSize', newRect.slice(2, 4));
      ipcRenderer.send('callMainWindowMethod', 'setPosition', newRect.slice(0, 2));
      ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [newRect.slice(2, 4)[0] / newRect.slice(2, 4)[1]]);
    }
    return newRect
  }

  public calculateWindowRect(videoSize: number[], videoExisted: boolean, oldRect: number[], maxSize?: number[]): number[] {
    if (!maxSize) {
      maxSize = WINDOWRECT.slice(2, 4);
    }
    const screenSize = WINDOWRECT.slice(2, 4);
    const [newWidth, newHeight] = this.calculateWindowSize(MINSIZE, maxSize, videoSize, videoExisted, screenSize);
    const [newLeft, newTop] = this.calculateWindowPosition(oldRect, WINDOWRECT, [newWidth, newHeight]);
    const rect = [newLeft, newTop, newWidth, newHeight];
    ipcRenderer.send('callMainWindowMethod', 'setSize', rect.slice(2, 4));
    ipcRenderer.send('callMainWindowMethod', 'setPosition', rect.slice(0, 2));
    ipcRenderer.send('callMainWindowMethod', 'setAspectRatio', [rect.slice(2, 4)[0] / rect.slice(2, 4)[1]]);
    return rect;
  }

  public calculateWindowScaleBy(fullScreen: boolean, windowAngle: number, videoRatio: number, windowRatio?: number): number {
    let result = 0;
    if (!windowRatio) {
      windowRatio = window.screen.width / window.screen.height
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