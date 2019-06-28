import { BrowserWindow, screen } from 'electron';

/**
 * Determine new window position
 */
function getPosition(bounds, mousePosition, newWidth, newHeight) {
  const {
    x, y, width, height,
  } = bounds;
  const center = { x: x + width / 2, y: y + height / 2 };
  let position = { x, y }; // top left as default anchor point
  if (mousePosition.x < center.x && mousePosition.y < center.y) {
    position = { x: x + width - newWidth, y: y + height - newHeight }; // bottom right
  } else if (mousePosition.x < center.x && mousePosition.y > center.y) {
    position = { x: x + width - newWidth, y }; // top right
  } else if (mousePosition.x > center.x && mousePosition.y < center.y) {
    position = { x, y: y + height - newHeight }; // bottom left
  }
  return position;
}

/**
 * Check if a and b is almost the same
 */
function almostSame(a, b) {
  return Math.abs(a - b) < 2;
}

function keepAspectRatio(evt, newBounds) {
  evt.preventDefault();
  if (!this._aspectRatio || this.isMaximized() || this.isFullScreen()) return;
  const mousePosition = screen.getCursorScreenPoint();
  const scaleFactor = screen.getDisplayNearestPoint(mousePosition).scaleFactor;
  const bounds = this.getBounds();
  const { width: oldWidth, height: oldHeight } = bounds;
  const [minimumWidth, minimumHeight] = this.getMinimumSize();
  let { width: newWidth, height: newHeight } = newBounds;
  newWidth /= scaleFactor;
  newHeight /= scaleFactor;
  if (newWidth < minimumWidth) newWidth = minimumWidth;
  if (newHeight < minimumHeight) newHeight = minimumHeight;

  if ((!almostSame(newWidth, oldWidth) && !almostSame(newHeight, oldHeight)
      && newWidth - oldWidth < newHeight - oldHeight)
    || almostSame(newHeight, oldHeight)
  ) {

    newHeight = Math.round(newWidth / this._aspectRatio);
  } else {

    newWidth = Math.round(newHeight * this._aspectRatio);
  }

  const position = getPosition(bounds, mousePosition, newWidth, newHeight);
  const finalBounds = {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
    x: Math.round(position.x),
    y: Math.round(position.y),
  };
  this.setBounds(finalBounds);
}

if (process.platform !== 'darwin') {
  BrowserWindow.prototype.setAspectRatio = function setAspectRatio(aspectRatio) {
    this._aspectRatio = aspectRatio;
    if (!this._keepAspectRatioListener) {
      this.on('will-resize', keepAspectRatio);
      this._keepAspectRatioListener = true;
    }
  };
}
