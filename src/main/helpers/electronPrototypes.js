import { BrowserWindow, screen } from 'electron';

function keepAspectRatio(evt, newBounds) {
  evt.preventDefault();
  if (!this._aspectRatio || this.isMaximized() || this.isFullScreen()) return;
  const mousePosition = screen.getCursorScreenPoint();
  const {
    x, y, width, height,
  } = this.getBounds();
  const [oldWidth, oldHeight] = this.getSize();
  const [minimumWidth, minimumHeight] = this.getMinimumSize();
  let { width: newWidth, height: newHeight } = newBounds;
  if (newWidth < minimumWidth) newWidth = minimumWidth;
  if (newHeight < minimumHeight) newHeight = minimumHeight;

  if (newWidth - oldWidth < newHeight - oldHeight) {
    newHeight = parseInt(newWidth / this._aspectRatio, 10);
  } else {
    newWidth = parseInt(newHeight * this._aspectRatio, 10);
  }
  const center = { x: x + width / 2, y: y + height / 2 };
  let anchor = { x, y }; // top left as default
  if (mousePosition.x < center.x && mousePosition.y < center.y) {
    anchor = { x: x + width - newWidth, y: y + height - newHeight }; // bottom right
  } else if (mousePosition.x < center.x && mousePosition.y > center.y) {
    anchor = { x: x + width - newWidth, y }; // top right
  } else if (mousePosition.x > center.x && mousePosition.y < center.y) {
    anchor = { x, y: y + height - newHeight }; // bottom left
  }
  const finalBounds = { width: newWidth, height: newHeight, ...anchor };
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
