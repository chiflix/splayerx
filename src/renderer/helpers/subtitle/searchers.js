import {
  dirname, extname, basename, join,
} from 'path';
import { readdir } from 'fs';
import { ipcRenderer } from 'electron';
import Sagi from '@/libs/sagi';
import helpers from '@/helpers';

const { mediaQuickHash: calculateMediaIdentity } = helpers.methods;

export function searchForLocalList(videoSrc, supportedExtensions) {
  return new Promise((resolve, reject) => {
    const videoDir = dirname(videoSrc);
    const videoBasename = basename(videoSrc, extname(videoSrc)).toLowerCase();
    const videoFilename = basename(videoSrc).toLowerCase();
    const validExtensions = supportedExtensions || ['srt', 'ass', 'vtt'];
    const extensionRegex = new RegExp(`\\.(${validExtensions.join('|')})$`);
    readdir(videoDir, (err, files) => {
      if (err) reject(err);
      resolve(files
        .filter((subtitleFilename) => {
          const lowerCasedName = subtitleFilename.toLowerCase();
          return (
            extensionRegex.test(lowerCasedName)
            && lowerCasedName.slice(0, lowerCasedName.lastIndexOf('.')) === videoBasename
            && lowerCasedName !== videoFilename
          );
        })
        .map(subtitleFilename => ({
          src: join(videoDir, subtitleFilename),
          type: 'local',
        })));
    });
  });
}

export function fetchOnlineList(videoSrc, languageCode, hints) {
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
    calculateMediaIdentity(videoSrc)
      .then(mediaIdentity => Promise.race([
        Sagi.mediaTranslate({ mediaIdentity, languageCode, hints }),
        new Promise((resolve, reject) => setTimeout(() => reject(), 10000)),
      ]))
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
        const normalizeStream = subtitleStream => ({
          src: subtitleStream.index,
          type: 'embedded',
          options: {
            videoSrc,
            streamIndex: subtitleStream.index,
            codec: subtitleStream.codec_name,
            language: subtitleStream.tags.language,
            name: subtitleStream.tags.title,
            isDefault: !!subtitleStream.disposition.default,
          }, // eslint-disable-line camelcase
        });
        resolve(subtitleStreams.map(normalizeStream));
      } catch (error) {
        reject(error);
      }
    });
  });
}
