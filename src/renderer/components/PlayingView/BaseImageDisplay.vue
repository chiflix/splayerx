<script>
export default {
  name: 'base-image-display',
  props: {
    imgSrc: {
      required: true,
    },
    $_style: {
      type: Object,
    },
    attributes: Object,
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
          URL: new RegExp(/^https?:\/\//),
          DataURI: new RegExp(/^data:image\//),
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
        case 'URL':
        case 'DataURI':
        case 'Blob': {
          elementName = 'img';
          break;
        }
        case 'ImageBitmap':
        case 'ImageData': {
          elementName = 'canvas';
          break;
        }
      }
      return elementName;
    },
    getImageOptions(imgSrc, imageType) {
      const type = imageType;
      let options = {};
      let outerWidth = '';
      let outerHeight = '';
      if (this.width >= 0 && this.height >= 0) {
        outerWidth = `${this.width}px`;
        outerHeight = `${this.height}px`;
      }
      options = {
        style: this.$_style,
        attrs: outerWidth && outerHeight ? {
          width: outerWidth,
          height: outerHeight,
        } : {},
      };
      switch (type) {
        case 'URL':
        case 'DataURI': {
          options = Object.assign(
            options,
            { attrs: Object.assign(
              options.attrs,
              { src: imgSrc, },
              this.attributes,
            )},
          );
          break;
        }
        case 'Blob': {
          const url = URL.createObjectURL(imgSrc);
          options = Object.assign(
            options,
            { attrs: Object.assign(
              options.attrs,
              { src: url, },
              this.attributes,
            )},
          );
          break;
        }
      }

      return options;
    },
  },
  render(h) {
    const imageType = this.getImageType(this.imgSrc);
    const elementName = this.getElementName(imageType);
    const imageOptions = this.getImageOptions(this.imgSrc, imageType);

    return h(elementName, imageOptions);
  },
};
</script>

