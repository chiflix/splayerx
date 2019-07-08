import { BrowserWindow, screen } from 'electron';
import { mouse } from './mouse';

function near(a, b) {
  return Math.abs(b - a) < 5;
}

/**
 * Determine which point to resize relative to
 * @param bounds Bounds of BrowserWindow
 * @param mousePosition Position of mouse
 */
function getAnchor(bounds, mousePosition) {
  const {
    x, y, width, height,
  } = bounds;
  bounds = {
    x, y, width, height,
  };
  const center = { x: x + width / 2, y: y + height / 2 };
  let anchor = { x, y };
  let type = 'top-left';
  if (mousePosition.x < center.x && mousePosition.y < center.y) {
    anchor = { x: x + width, y: y + height };
    type = 'bottom-right';
  } else if (mousePosition.x < center.x && mousePosition.y > center.y) {
    anchor = { x: x + width, y };
    type = 'top-right';
  } else if (mousePosition.x > center.x && mousePosition.y < center.y) {
    anchor = { x, y: y + height };
    type = 'bottom-left';
  }
  return { type, anchor, bounds };
}

function keepAspectRatio(evt, newBounds) {
  if (!this._aspectRatio || this.isMaximized() || this.isFullScreen()) return;
  evt.preventDefault();

  const currentBounds = this.getBounds();
  const mousePosition = screen.getCursorScreenPoint();
  if (!this._resizeAnchor) {
    this._resizeAnchor = getAnchor(currentBounds, this._mouseDownPoint || mousePosition);
  }
  const { type, anchor } = this._resizeAnchor;

  const scaleFactor = screen.getDisplayNearestPoint(mousePosition).scaleFactor;
  let { width: newWidth, height: newHeight } = newBounds;
  newWidth /= scaleFactor;
  newHeight /= scaleFactor;
  let takeWidth = true;
  takeWidth = newWidth / newHeight < this._aspectRatio;
  if (this._resizeType === 'vertical') {
    takeWidth = false;
  } else if (this._resizeType === 'horizontal') {
    takeWidth = true;
  } else {
    takeWidth = newWidth / newHeight < this._aspectRatio;
  }
  if (takeWidth) {
    newHeight = newWidth / this._aspectRatio;
  } else {
    newWidth = newHeight * this._aspectRatio;
  }

  let { x, y } = anchor;
  if (type.includes('right')) x -= newWidth;
  if (type.includes('bottom')) y -= newHeight;

  const finalBounds = {
    width: Math.floor(newWidth),
    height: Math.floor(newHeight),
    x: Math.floor(x),
    y: Math.floor(y),
  };
  this.setBounds(finalBounds);
}

if (process.platform !== 'darwin') {
  BrowserWindow.prototype.setAspectRatio = function setAspectRatio(aspectRatio) {
    this._aspectRatio = aspectRatio;
    const resetResizeState = () => {
      this._mouseDownPoint = null;
      this._resizeAnchor = null;
      this._resizeType = 'free';
    };
    resetResizeState();
    if (!this._keepAspectRatioListener) {
      const onLeftDown = (x, y) => {
        const mousePosition = screen.getCursorScreenPoint();
        const scaleFactor = screen.getDisplayNearestPoint(mousePosition).scaleFactor;
        x /= scaleFactor;
        y /= scaleFactor;
        this._mouseDownPoint = { x, y };
        this._resizeAnchor = null;
        const bounds = this.getBounds();
        const onVerticalEdge = near(x, bounds.x) || near(x, bounds.x + bounds.width);
        const onHorizontalEdge = near(y, bounds.y) || near(y, bounds.y + bounds.height);
        if (onHorizontalEdge && !onVerticalEdge) this._resizeType = 'vertical';
        if (!onHorizontalEdge && onVerticalEdge) this._resizeType = 'horizontal';
      };
      const onLeftUp = () => {
        resetResizeState();
      };

      this.on('will-resize', keepAspectRatio);
      mouse.on('left-down', onLeftDown);
      mouse.on('left-up', onLeftUp);

      this._keepAspectRatioListener = () => {
        this.removeListener('will-resize', keepAspectRatio);
        mouse.off('left-down', onLeftDown);
        mouse.off('left-up', onLeftUp);
      };
    }
  };
}
