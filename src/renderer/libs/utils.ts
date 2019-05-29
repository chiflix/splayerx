
/** 计算文本宽度
 * @description
 * @param {string} fontSize
 * @param {string} fontFamily
 * @param {string} text
 * @returns {number}
 */
export function getTextWidth(fontSize: string, fontFamily: string, text: string): number {
  const span = document.createElement('span');
  let result = span.offsetWidth;
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
