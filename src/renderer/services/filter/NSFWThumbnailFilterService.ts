// https://github.com/infinitered/nsfwjs
import path from 'path';
import * as tf from '@tensorflow/tfjs';
import { filePathToUrl } from '@/helpers/path';
import { IMediaFilter } from '@/interfaces/IMediaFilter';

const NSFW_CLASSES: { [classId: number]: string } = {
  0: 'Drawing',
  1: 'Hentai',
  2: 'Neutral',
  3: 'Porn',
  4: 'Sexy',
};

interface INsfwJsOptions {
  size: number
}

const IMAGE_SIZE = 224; // default to Mobilenet v2

async function getTopKClasses(
  logits: tf.Tensor2D,
  topK: number,
): Promise<{ className: string; probability: number }[]> {
  const values = await logits.data();

  const valuesAndIndices = [];
  for (let i = 0; i < values.length; i += 1) {
    valuesAndIndices.push({ value: values[i], index: i });
  }
  valuesAndIndices.sort((a, b) => b.value - a.value);
  const topkValues = new Float32Array(topK);
  const topkIndices = new Int32Array(topK);
  for (let i = 0; i < topK; i += 1) {
    topkValues[i] = valuesAndIndices[i].value;
    topkIndices[i] = valuesAndIndices[i].index;
  }

  const topClassesAndProbs = [];
  for (let i = 0; i < topkIndices.length; i += 1) {
    topClassesAndProbs.push({
      className: NSFW_CLASSES[topkIndices[i]],
      probability: topkValues[i],
    });
  }
  return topClassesAndProbs;
}

class NSFWJS {
  public endpoints: string[]

  private options: INsfwJsOptions

  private model: tf.LayersModel

  private intermediateModels: { [layerName: string]: tf.LayersModel } = {}

  private normalizationOffset: tf.Scalar

  public constructor(options: INsfwJsOptions) {
    this.options = options;
    this.normalizationOffset = tf.scalar(255);
  }

  public async load() {
    this.model = await tf.loadLayersModel(filePathToUrl(path.join(__static, 'nsfw/model.json')));
    this.endpoints = this.model.layers.map(l => l.name);
    const { size } = this.options;

    // Warmup the model.
    const result = tf.tidy(() => this.model.predict(tf.zeros([1, size, size, 3]))) as tf.Tensor;
    await result.data();
    result.dispose();
  }

  /**
   * Infers through the model. Optionally takes an endpoint to return an
   * intermediate activation.
   *
   * @param img The image to classify. Can be a tensor or a DOM element image,
   * video, or canvas.
   * @param endpoint The endpoint to infer through. If not defined, returns
   * logits.
   */
  public infer(
    img:
    | tf.Tensor3D
    | ImageData
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement,
    endpoint?: string,
  ): tf.Tensor {
    if (endpoint != null && this.endpoints.indexOf(endpoint) === -1) {
      throw new Error(
        `Unknown endpoint ${endpoint}. Available endpoints: `
        + `${this.endpoints}.`,
      );
    }

    return tf.tidy(() => {
      if (!(img instanceof tf.Tensor)) {
        img = tf.browser.fromPixels(img);
      }

      // Normalize the image from [0, 255] to [0, 1].
      const normalized = img
        .toFloat()
        .div(this.normalizationOffset) as tf.Tensor3D;

      // Resize the image to
      let resized = normalized;
      const { size } = this.options;
      // check width and height if resize needed
      if (img.shape[0] !== size || img.shape[1] !== size) {
        const alignCorners = true;
        resized = tf.image.resizeBilinear(
          normalized,
          [size, size],
          alignCorners,
        );
      }

      // Reshape to a single-element batch so we can pass it to predict.
      const batched = resized.reshape([1, size, size, 3]);

      let model: tf.LayersModel;
      if (endpoint == null) {
        model = this.model;
      } else {
        if (this.intermediateModels[endpoint] == null) {
          const layer = this.model.layers.find(l => l.name === endpoint) || this.model.layers[0];
          this.intermediateModels[endpoint] = tf.model({
            inputs: this.model.inputs,
            outputs: layer.output,
          });
        }
        model = this.intermediateModels[endpoint];
      }

      // return logits
      return model.predict(batched) as tf.Tensor2D;
    });
  }

  /**
   * Classifies an image from the 5 classes returning a map of
   * the most likely class names to their probability.
   *
   * @param img The image to classify. Can be a tensor or a DOM element image,
   * video, or canvas.
   * @param topk How many top values to use. Defaults to 5
   */
  public async classify(
    img:
    | tf.Tensor3D
    | ImageData
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement,
    topk = 5,
  ): Promise<{ className: string; probability: number }[]> {
    const logits = this.infer(img) as tf.Tensor2D;

    const classes = await getTopKClasses(logits, topk);

    logits.dispose();

    return classes;
  }
}


export default class NSFWFilterService implements IMediaFilter {
  public constructor() {
    setTimeout(() => this.getNsfwNet()); // warmup
  }

  private nsfwnet: NSFWJS;

  private async getNsfwNet() {
    if (this.nsfwnet) return this.nsfwnet;
    this.nsfwnet = new NSFWJS({ size: IMAGE_SIZE });
    await this.nsfwnet.load(); // TODO: slow, may put in a worker process
    return this.nsfwnet;
  }

  /**
   * Check if image is not safe for work
   * @param src Source of image
   */
  public async checkImage(src: string) {
    try {
      const nsfwnet = await this.getNsfwNet();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
        setTimeout(reject, 1000);
      });
      const result = await nsfwnet.classify(img);
      return result.some(item => (
        item.className === NSFW_CLASSES[1] || item.className === NSFW_CLASSES[3]
      ) && item.probability >= 0.5);
    } catch (ex) {
      console.error(ex, src);
      return false;
    }
  }
}

export const nsfwThumbnailFilterService = new NSFWFilterService();
