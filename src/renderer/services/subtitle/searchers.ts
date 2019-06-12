import {
  dirname, extname, basename, join,
} from 'path';
import { readdir } from 'fs';
import { ipcRenderer, Event } from 'electron';
import Sagi from '@/helpers/sagi';
import helpers from '@/helpers';
import {
  subtitleExtensions, subtitleCodecs,
  SubtitleType, SubtitleFormat, SubtitleCodec, ISubtitleStream,
  RawLocalSubtitle, RawOnlineSubtitle, RawEmbeddedSubtitle,
} from '@/interfaces/services/ISubtitle';
import { LanguageNames } from '@/libs/language/allLanguages';

const { mediaQuickHash: calculateMediaIdentity } = helpers.methods;

export function searchForLocalList(videoSrc: string): Promise<RawLocalSubtitle[]> {
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
            name: filename,
            type: SubtitleType.Local,
            format: SubtitleFormat[extname(filename.slice(1))],
          }))
        );
      }
    });
  });
}

export function fetchOnlineList(videoSrc: string, languageCode: LanguageNames, hints: string): Promise<RawOnlineSubtitle[]> {
  const subtitleInfoNormalizer = (subtitle: any): RawOnlineSubtitle => {
    const { languageCode: language, transcriptIdentity: origin, ranking } = subtitle;
    return ({
      origin,
      type: SubtitleType.Online,
      format: SubtitleFormat.Online,
      language,
      ranking,
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

export function retrieveEmbeddedList(videoSrc: string): Promise<RawEmbeddedSubtitle[]> {
  ipcRenderer.send('mediaInfo', videoSrc);
  return new Promise((resolve, reject) => {
    setTimeout(() => { reject(new Error('Embedded Subtitles Retrieve Timeout!')); }, 20000);
    ipcRenderer.once(`mediaInfo-${videoSrc}-reply`, (event: Event, info: string) => {
      try {
        const subtitleStreams: ISubtitleStream[] = JSON.parse(info).streams
          .filter((stream: ISubtitleStream) => (
            stream.codec_type === 'subtitle' &&
            subtitleCodecs.includes(stream.codec_name)
          ));
        const normalizeStream = (subtitleStream: ISubtitleStream): RawEmbeddedSubtitle => ({
          origin: {
            streamIndex: subtitleStream.index,
            videoSrc,
          },
          format: SubtitleCodec[subtitleStream.codec_name],
          type: SubtitleType.Embedded,
          language: subtitleStream.tags.language,
          name: subtitleStream.tags.title,
          codec: subtitleStream.codec_name,
          isDefault: !!subtitleStream.disposition.default,
        });
        resolve(subtitleStreams.map(normalizeStream));
      } catch (error) {
        reject(error);
      }
    });
  });
}
