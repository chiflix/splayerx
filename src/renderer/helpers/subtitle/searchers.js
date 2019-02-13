import { dirname, extname, basename, join } from 'path';
import { readdir } from 'fs';
import { ipcRenderer } from 'electron';
import Sagi from '@/helpers/sagi';
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
            extensionRegex.test(lowerCasedName) &&
            lowerCasedName.slice(0, lowerCasedName.lastIndexOf('.')) === videoBasename &&
            lowerCasedName !== videoFilename
          );
        })
        .map(subtitleFilename => ({
          src: join(videoDir, subtitleFilename),
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
    calculateMediaIdentity(videoSrc)
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
