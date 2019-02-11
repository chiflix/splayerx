import { dirname, extname, basename, join } from 'path';
import { readdir } from 'fs';
import { ipcRenderer } from 'electron';
import Sagi from '@/helpers/sagi';
import helpers from '@/helpers';

const { mediaQuickHash: getMediaIdentity } = helpers.methods;

export function searchforLocalList(videoSrc, supportedExtensions) {
  return new Promise((resolve, reject) => {
    const videoDir = dirname(videoSrc);
    const filename = basename(videoSrc, extname(videoSrc));
    const extensionRegex = new RegExp(`\\.(${supportedExtensions.join('|')})$`);
    readdir(videoDir, (err, files) => {
      if (err) reject(err);
      const subtitles = files.filter(file =>
        (extensionRegex.test(file) && file.slice(0, file.lastIndexOf('.')) === filename));
      resolve(subtitles.map(subtitle => ({
        src: join(dirname(videoSrc), subtitle),
        type: 'local',
      })));
    });
  });
}

export function fetchOnlineList(videoSrc, languageCode) {
  const subtitleInfoNormalizer = (subtitle) => {
    const { languageCode: code, transcriptIdentity: src, ranking } = subtitle;
    return ({
      src,
      type: 'online',
      options: {
        language: code,
        ranking,
      },
    });
  };
  return new Promise((resolve, reject) => {
    getMediaIdentity(videoSrc)
      .then(mediaIdentity => Sagi.mediaTranslate({ mediaIdentity, languageCode }))
      .then(results => resolve(results.map(subtitleInfoNormalizer)))
      .catch(err => reject(err));
  });
}

export function retrieveEmbeddedList(videoSrc, supportedCodecs) {
  ipcRenderer.send('mediaInfo', videoSrc);
  return new Promise((resolve, reject) => {
    setTimeout(() => { reject(new Error('Embedded Subtitles Retrieve Timeout!')); }, 20000);
    ipcRenderer.once(`mediaInfo-${videoSrc}-reply`, (event, info) => {
      try {
        const subtitleStreams = JSON.parse(info).streams
          .filter(stream => stream.codec_type === 'subtitle' && supportedCodecs.includes(stream.codec_name)); // eslint-disable-line camelcase;
        if (!subtitleStreams.length) resolve([]);
        resolve(...subtitleStreams.map(subtitle => ({
          src: subtitle.index,
          type: 'embedded',
          options: {
            videoSrc,
            streamIndex: subtitle.index,
            codec: subtitle.codec_name,
            language: subtitle.tags.language,
            name: subtitle.tags.title,
            isDefault: !!subtitle.disposition.default,
          }, // eslint-disable-line camelcase
        })));
      } catch (error) {
        reject(error);
      }
    });
  });
}
