export function setElementStyle(el: HTMLElement, propertyName: string, value: string | null) {
  if (!el || !el.style) {
    console.trace('Try to set style to undefined element');
    return;
  }
  el.style.setProperty(propertyName, value);
}
