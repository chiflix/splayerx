const canvasMap = new Map();
const thumbnailStatusSet = new Map();
let bitmapCanvas = null;
let maxThumbnailSize = [];
let thumbnailSize = [];
let compositionSize = [];
const THUMBNAILS_PER_COMPOSITION = 30;
// How thumbnails layout ([row, column])
const THUMBNAIL_LAYOUT = [5, 6];

function getImageBitmapPosition(thumbnailIndex, THUMBNAIL_LAYOUT, maxThumbnailSize) {
  return [
    // Thumbnail destination position X
    (thumbnailIndex % THUMBNAIL_LAYOUT[1]) * maxThumbnailSize[0],
    // Thumbnail destination position Y
    Math.floor((thumbnailIndex % THUMBNAILS_PER_COMPOSITION) / THUMBNAIL_LAYOUT[1])
    * maxThumbnailSize[1],
  ];
}
function setThumbnailSize(size) {
  thumbnailSize = size;
  [bitmapCanvas.width, bitmapCanvas.height] = thumbnailSize;
}
function thumbnailSetInit(canvasIndex, thumbnailIndex) {
  let thumbnailSet = null;
  if (!thumbnailStatusSet.get(canvasIndex)) {
    thumbnailSet = new Set();
  } else {
    thumbnailSet = thumbnailStatusSet.get(canvasIndex);
  }
  thumbnailSet.add(thumbnailIndex);
  thumbnailStatusSet.set(canvasIndex, thumbnailSet);
  return thumbnailSet.size;
}
function saveBlob(blob, canvasIndex) {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.readyState === 2) {
      console.timeEnd('[Thumbnail|Composition|FileReader]');
      postMessage({
        type: 'composition-arraybuffer',
        compositionIndex: canvasIndex,
        arraybuffer: reader.result,
      }, [reader.result]);
    }
  };
  reader.readAsArrayBuffer(blob);
  console.time('[Thumbnail|Composition|FileReader]');
}

/* eslint-disable no-restricted-globals */
self.addEventListener('message', (event) => {
  switch (event.data.type) {
    default: {
      console.error(`[Thumbnail|Worker]: ${event.data.type || 'Event type'} is not defined.`);
      break;
    }
    case 'offscreencanvas-init': {
      ({ bitmapCanvas } = event.data);
      setThumbnailSize(event.data.actualSize);
      console.log('[Thumbnail|Worker|Start]: Canvas Size:', event.data.actualSize, bitmapCanvas.width, bitmapCanvas.height);
      break;
    }
    case 'generation-start': {
      // Size info initiation
      ({ maxThumbnailSize } = event.data);
      console.log(maxThumbnailSize);
      compositionSize = maxThumbnailSize.map(e => e * THUMBNAILS_PER_COMPOSITION);
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
        0, 0, event.data.thumbnailImageBitmap.width, event.data.thumbnailImageBitmap.height,
        // Thumbnail destination position
        ...getImageBitmapPosition(thumbnailIndex, THUMBNAIL_LAYOUT, maxThumbnailSize),
        // Thumbnail destination size
        ...maxThumbnailSize,
      );
      if (thumbnailSetInit(canvasIndex, thumbnailIndex) === THUMBNAILS_PER_COMPOSITION) {
        console.time('Composition');
        canvasMap.get(canvasIndex).convertToBlob({
          type: 'image/webp',
          quality: 0.92,
        }).then((result) => {
          console.timeEnd('Composition');
          console.log(`[Thumbnail|Worker|Composition]: Composition ${canvasIndex} generated!`, result);
          saveBlob(result, canvasIndex);
        });
      }
      postMessage({
        type: 'thumbnail-set',
        index: thumbnailIndex,
      });
      break;
    }
    case 'thumbnail-change': {
      setThumbnailSize(event.data.size);
      console.log('[Thumbnail|Worker|Change]: Canvas Size:', event.data.size, bitmapCanvas.width, bitmapCanvas.height);
      break;
    }
    case 'thumbnail-request': {
      const thumbnailIndex = event.data.index;
      const canvasIndex = Math.floor(thumbnailIndex / THUMBNAILS_PER_COMPOSITION);
      console.log('[Thumbnail|Worker|Request]: Canvas Size:', bitmapCanvas.width, bitmapCanvas.height);
      console.log(`I need to draw image No.${thumbnailIndex}!`);
      if (canvasMap.get(canvasIndex)) {
        console.time('image draw');
        createImageBitmap(
          canvasMap.get(canvasIndex),
          ...getImageBitmapPosition(thumbnailIndex, THUMBNAIL_LAYOUT, maxThumbnailSize),
          ...maxThumbnailSize,
        ).then((result) => {
          const gl = bitmapCanvas.getContext('2d');
          gl.drawImage(result, 0, 0, ...thumbnailSize);
          gl.commit();
        });
        console.timeEnd('image draw');
      }
    }
  }
});
