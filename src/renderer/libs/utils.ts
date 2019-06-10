/** 计算文本宽度
 * @description
 * @param {string} fontSize
 * @param {string} fontFamily
 * @param {string} text
 * @returns {number}
 */
export function getTextWidth(fontSize: string, fontFamily: string, text: string): number {
  const span: HTMLElement = document.createElement('span');
  let result: number = span.offsetWidth;
  span.style.visibility = 'hidden';
  span.style.fontSize = fontSize;
  span.style.fontFamily = fontFamily;
  span.style.display = 'inline-block';
  span.style.fontWeight = '700';
  span.style.letterSpacing = '0.2px';
  document.body.appendChild(span);
  if (typeof span.textContent !== 'undefined') {
    span.textContent = text;
  } else {
    span.innerText = text;
  }
  result = parseFloat(window.getComputedStyle(span).width || '0') - result;
  if (span.parentNode) {
    span.parentNode.removeChild(span);
  }
  return result;
}

export type ShortCut = {
  shortCut: string,
  smallShortCut: string,
}

const MAX_SHORT_CUT_SIZE = 1080;
const MIN_SHORT_CUT_SIZE = 122.6;
const SHORT_CURT_QUALITY = 0.8;
const SHORT_CURT_TYPE = 'image/jpeg';

/**
 * @description canvas 生成观看视频的最后一帧图片
 * @author tanghaixiang@xindong.com
 * @date 2019-06-10
 * @export
 * @param {HTMLVideoElement} video
 * @param {HTMLCanvasElement} canvas
 * @param {number} videoWidth
 * @param {number} videoHeight
 * @returns {ShortCut} 最后一帧图，有常规尺寸和小尺寸
 */
export function generateShortCutImageBy(video: HTMLVideoElement, canvas: HTMLCanvasElement, videoWidth: number, videoHeight: number): ShortCut {
  let result: ShortCut = {
    shortCut: '',
    smallShortCut: '',
  };
  const canvasCTX = canvas.getContext('2d');
  if (canvasCTX) {
    [canvas.width, canvas.height] = [(videoWidth / videoHeight) * MAX_SHORT_CUT_SIZE, MAX_SHORT_CUT_SIZE];
    canvasCTX.drawImage(
      video, 0, 0, videoWidth, videoHeight,
      0, 0, (videoWidth / videoHeight) * MAX_SHORT_CUT_SIZE, MAX_SHORT_CUT_SIZE,
    );
    const imagePath = canvas.toDataURL(SHORT_CURT_TYPE, SHORT_CURT_QUALITY);
    result.shortCut = imagePath;
    // 用于测试截图的代码，以后可能还会用到
    // const img = imagePath.replace(/^data:image\/\w+;base64,/, '');
    // fs.writeFileSync('/Users/jinnaide/Desktop/screenshot.png', img, 'base64');
    [canvas.width, canvas.height] = [(videoWidth / videoHeight) * MIN_SHORT_CUT_SIZE, MIN_SHORT_CUT_SIZE];
    canvasCTX.drawImage(
      video, 0, 0, videoWidth, videoHeight,
      0, 0, (videoWidth / videoHeight) * MIN_SHORT_CUT_SIZE, MIN_SHORT_CUT_SIZE,
    );
    const smallImagePath = canvas.toDataURL(SHORT_CURT_TYPE, SHORT_CURT_QUALITY);
    result.smallShortCut = smallImagePath;
  }
  return result;
}
