export function keydownCalculator(existedCodes, currentCode, ignoredKeys = []) {
  existedCodes = [...existedCodes];
  const isIgnoredKey = (
    Array.isArray(ignoredKeys)
    && ignoredKeys.length
    && ignoredKeys.some(code => currentCode.startsWith(code))
  );
  if (!isIgnoredKey && !existedCodes.includes(currentCode)) existedCodes.push(currentCode);
  return existedCodes;
}
export function specialKeydownCalculator(existedCodes, currentCode) {
  return keydownCalculator(existedCodes, currentCode, ['Alt', 'Shift', 'Control', 'Meta']);
}

export function keyupCalculator(existedCodes, currentCode, ignoredKeys = []) {
  existedCodes = [...existedCodes];
  const isIgnoredKey = (
    Array.isArray(ignoredKeys)
    && ignoredKeys.length
    && ignoredKeys.some(code => currentCode.startsWith(code))
  );
  // console.log('Keyboard:', currentCode, ignoredKeys.some(code => currentCode.startsWith(code)));
  if (!isIgnoredKey && existedCodes.includes(currentCode)) {
    existedCodes.splice(existedCodes.indexOf(currentCode), 1);
  }
  return existedCodes;
}
export function specialKeyupCalculator(existedCodes, currentCode) {
  return keyupCalculator(existedCodes, currentCode, ['Alt', 'Shift', 'Control', 'Meta']);
}
