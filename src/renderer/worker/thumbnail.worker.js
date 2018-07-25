const imageMap = new Map();
const canvasMap = new Map();
let bitmapCanvas = null;
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
    Math.floor((thumbnailIndex % THUMBNAILS_PER_COMPOSITION) / THUMBNAIL_LAYOUT[1])
    * thumbnailSize[1],
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
      ({ thumbnailSize, bitmapCanvas } = event.data);
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
      console.log(...event.data.originSize);
      canvasContext.drawImage(
        event.data.thumbnailImageBitmap,
        // Thumbnail source position and size
        0, 0, ...event.data.originSize,
        // Thumbnail destination position
        ...getImageBitmapPosition(thumbnailIndex, THUMBNAIL_LAYOUT, thumbnailSize),
        // Thumbnail destination size
        ...thumbnailSize,
      );
      imageMap.set(thumbnailIndex, event.data.thumbnailImageBitmap);
      break;
    }
    case 'thumbnail-request': {
      const thumbnailIndex = event.data.index;
      const canvasIndex = Math.floor(thumbnailIndex / THUMBNAILS_PER_COMPOSITION);
      if (!bitmapCanvas.width || !bitmapCanvas.height) {
        [bitmapCanvas.width, bitmapCanvas.height] = event.data.size;
      }
      console.log(`I need to draw image No.${thumbnailIndex}!`);
      if (canvasMap.get(canvasIndex)) {
        console.time('image draw');
        createImageBitmap(
          canvasMap.get(canvasIndex),
          ...getImageBitmapPosition(thumbnailIndex, THUMBNAIL_LAYOUT, thumbnailSize),
          ...thumbnailSize,
        ).then((result) => {
          const gl = bitmapCanvas.getContext('2d');
          gl.drawImage(result, 0, 0, ...event.data.size);
          gl.commit();
        });
        console.timeEnd('image draw');
      }
    }
  }
});
