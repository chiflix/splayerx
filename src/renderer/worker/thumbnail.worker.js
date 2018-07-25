const imageMap = new Map();
const canvasMap = new Map();
let thumbnailSize = [];
let compositionSize = [];
const THUMBNAILS_PER_COMPOSITION = 30;
// How thumbnails layout ([row, column])
const THUMBNAIL_LAYOUT = [5, 6];

function getImageBitmapPosition(thumbnailIndex, THUMBNAIL_LAYOUT, thumbnailSize) {
  return [
    // Thumbnail destination position X
    (thumbnailIndex % THUMBNAIL_LAYOUT[1]) * thumbnailSize[0],
    // Thumbnail destination position Y
    Math.floor(thumbnailIndex / THUMBNAIL_LAYOUT[0]) * thumbnailSize[1],
  ];
}

/* eslint-disable no-restricted-globals */
self.addEventListener('message', (event) => {
  switch (event.data.type) {
    default: {
      console.error(`[Thumbnail|Worker]: ${event.data.type || 'Event type'} is not defined.`);
      break;
    }
    case 'generation-start': {
      // Size info initiation
      ({ thumbnailSize } = event.data);
      console.log(thumbnailSize);
      compositionSize = thumbnailSize.map(e => e * THUMBNAILS_PER_COMPOSITION);
      console.log('[Thumbnail|Worker]:', ...compositionSize);
      break;
    }
    case 'thumbnail-generated': {
      const canvasIndex = Math.floor(event.data.index / THUMBNAILS_PER_COMPOSITION);
      const thumbnailIndex = event.data.index;
      if (!canvasMap.get(canvasIndex)) {
        canvasMap.set(canvasIndex, new OffscreenCanvas(...compositionSize));
      }
      const currentCanvas = canvasMap.get(canvasIndex);
      const canvasContext = currentCanvas.getContext('2d');
      canvasContext.drawImage(
        event.data.thumbnailImageBitmap,
        // Thumbnail source position and size
        0, 0, ...thumbnailSize,
        // Thumbnail destination position
        ...getImageBitmapPosition(thumbnailIndex, THUMBNAIL_LAYOUT, thumbnailSize),
        // Thumbnail destination size
        ...thumbnailSize,
      );
      imageMap.set(thumbnailIndex, event.data.thumbnailImageBitmap);
    }
  }
});
