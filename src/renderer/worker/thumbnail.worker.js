const imageMap = new Map();
const canvasMap = new Map();
let thumbnailSize = [];
let compositionSize = [];
const THUMBNAILS_PER_COMPOSITION = 30;

/* eslint-disable no-restricted-globals */
self.addEventListener('message', (event) => {
  switch (event.data.type) {
    default: {
      console.error(`${event.data.type} is not defined.`);
      break;
    }
    case 'generation-start': {
      // Size info initiation
      ({ thumbnailSize } = event.data);
      compositionSize = thumbnailSize.map(e => e * THUMBNAILS_PER_COMPOSITION);
      break;
    }
  }
});
