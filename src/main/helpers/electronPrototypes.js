import { BrowserWindow } from 'electron';

function keepAspectRatio() {
  clearTimeout(this._keepAspectRatioTimeout);
  this._keepAspectRatioTimeout = setTimeout(() => {
    if (!this._aspectRatio || this.isMaximized() || this.isFullScreen()) return;
    const size = this.getSize();
    const minimumSize = this.getMinimumSize();
    const currentRatio = size[0] / size[1];
    let [newWidth, newHeight] = size;
    if (newWidth < minimumSize[0]) newWidth = minimumSize[0];
    if (newHeight < minimumSize[1]) newHeight = minimumSize[1];

    if (currentRatio > this._aspectRatio) {
      newHeight = parseInt(newWidth / this._aspectRatio, 10);
    } else {
      newWidth = parseInt(newHeight * this._aspectRatio, 10);
    }
    this.setSize(newWidth, newHeight);
  }, 100);
}

if (process.platform !== 'darwin') {
  BrowserWindow.prototype.setAspectRatio = function setAspectRatio(aspectRatio) {
    this._aspectRatio = aspectRatio;
    if (!this._keepAspectRatioListener) {
      this.on('resize', keepAspectRatio);
      this._keepAspectRatioListener = true;
    }
  };
}
