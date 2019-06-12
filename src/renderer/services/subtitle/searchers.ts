import {
  dirname, extname, basename, join,
} from 'path';
import { readdir } from 'fs';
import { ipcRenderer } from 'electron';
import Sagi from '@/helpers/sagi';
import helpers from '@/helpers';
import { VideoPath, subtitleExtensions, IRawSubtitle, SubtitleType, SubtitleFormat, SubtitlePath } from '@/interfaces/services/ISubtitle';

const { mediaQuickHash: calculateMediaIdentity } = helpers.methods;

export function searchForLocalList(videoSrc: VideoPath): Promise<IRawSubtitle[]> {
  return new Promise((resolve, reject) => {
    const videoDir = dirname(videoSrc);
    const videoBasename = basename(videoSrc, extname(videoSrc));
    const isValidSubtitle = (filename: string) => {
      const subtitleExtname = extname(filename).slice(1);
      const subtitleBasename = basename(filename, subtitleExtname);
      return (
        subtitleExtensions.includes(subtitleExtname) &&
        subtitleBasename.toLowerCase() === videoBasename.toLowerCase()
      )
    };

    readdir(videoDir, (err, files) => {
      if (err) reject(err);
      else {
        resolve(files
          .filter(isValidSubtitle)
          .map(filename => ({
            origin: join(videoDir, filename),
            type: SubtitleType.Local,
            format: SubtitleFormat[extname(filename.slice(1))],
          }))
        );
      }
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
