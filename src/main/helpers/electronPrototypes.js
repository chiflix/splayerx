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

function keepAspectRatio(evt, newBounds) {
  evt.preventDefault();
  if (!this._aspectRatio || this.isMaximized() || this.isFullScreen()) return;
  const mousePosition = screen.getCursorScreenPoint();
  const scaleFactor = screen.getDisplayNearestPoint(mousePosition).scaleFactor;
  const bounds = this.getBounds();
  const { width: oldWidth, height: oldHeight } = bounds;
  const [minimumWidth, minimumHeight] = this.getMinimumSize();
  let { width: newWidth, height: newHeight } = newBounds;
  if (newWidth < minimumWidth) newWidth = minimumWidth;
  if (newHeight < minimumHeight) newHeight = minimumHeight;

  if ((newWidth !== oldWidth && newHeight !== oldHeight
      && newWidth - oldWidth < newHeight - oldHeight)
    || newHeight === oldHeight
  ) {
    newHeight = parseInt(newWidth / this._aspectRatio, 10);
  } else {
    newWidth = parseInt(newHeight * this._aspectRatio, 10);
  }
  const position = getPosition(bounds, mousePosition, newWidth, newHeight);
  const finalBounds = {
    width: Math.round(newWidth / scaleFactor),
    height: Math.round(newHeight / scaleFactor),
    x: Math.round(position.x / scaleFactor),
    y: Math.round(position.y / scaleFactor),
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
