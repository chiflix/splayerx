<template>
  <div class="base-image-display">
    <slot v-show="imageReady">此处为Image插槽</slot>
  </div>
</template>
<script>
export default {
  name: "base-image-display",
  props: {
    imgSrc: {
      required: true,
    },
    _style: {
      type: Object,
    },
    width: Number,
    height: Number,
  },
  data() {
    return {
      predefinedTypes: [
        'DataURI',
        'URL',
        'Blob',
        'ImageBitmap',
        'ImageData',
      ],
      imageType: null,
      imageReady: false,
    };
  },
  methods: {
    getImageType(imgSrc) {
      const src = imgSrc;
      let imgType = null;
      if (typeof src === 'string') {
        const imgURLRegexes = {
          'URL': new RegExp(/^https?:\/\//),
          'DataURI': new RegExp(/^data:/),
        };
        Object.keys(imgURLRegexes).forEach((regType) => {
          if (imgURLRegexes[regType].test(src)) {
            imgType = regType;
          }
        });
      } else if (typeof src === 'object') {
        const type = Object.prototype.toString.call(src).slice(8, -1);
        this.predefinedTypes.slice(2).forEach((predefinedType) => {
          if (type === predefinedType) {
            imgType = predefinedType;
          }
        });
      }
      return imgType;
    },
    getElementName(imageType) {
      const type = imageType;
      let elementName = null;
      switch (type) {
        default: {
          elementName = 'span';
          break;
        }
        case 'URL' || 'DataURI' || 'Blob': {
          elementName = 'img';
          break;
        }
        case 'ImageBitmap' || 'ImageData': {
          elementName = 'canvas';
          break;
        }
      }
      return elementName;
    },
    getImageOptions(imgSrc, imageType) {
      const type = imageType;
      let options = null;
      let outerWidth = '';
      let outerHeight = '';
      if (this.width >= 0 && this.height >= 0) {
        outerWidth = this.width + 'px';
        outerHeight = this.height + 'px';
      }
      switch (type) {
        default: {
          options = {
            style: this._style,
            attrs: outerWidth && outerHeight ? {
              width: outerWidth,
              height: outerHeight,
            } : {},
          };
        }
        case 'URL' || 'DataURI': {
          options = Object.assign(
            options,
            {
              attrs: {
                src: imgSrc,
              },
            },
          );
          break;
        }
        case 'Blob': {
          const url = URL.createObjectURL(imgSrc);
          options = Object.assign(
            options,
            {
              attrs: {
                src: url,
              },
            },
          );
          break;
        }
      }

      return options;
    },
  },
  created() {
    this.imageType = this.getImageType(this.imgSrc);
  },
  render(createElement) {
    const imageType = this.getImageType(this.imgSrc);
    const elementName = this.getElementName(imageType);
    const imageOptions = this.getImageOptions(this.imgSrc, imageType);

    return createElement(elementName, imageOptions);
  },
}
</script>

