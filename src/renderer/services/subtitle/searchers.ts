import {
  dirname, extname, basename, join,
} from 'path';
import { readdir } from 'fs';
import { ipcRenderer, Event } from 'electron';
import Sagi from '@/helpers/sagi';
import helpers from '@/helpers';
import { LocalSubtitle, OnlineSubtitle, EmbeddedSubtitle, ISubtitleStream, subtitleCodecs } from './loaders';
import { subtitleExtensions } from './parsers';
import { LanguageName } from '@/libs/language';

const { mediaQuickHash: calculateMediaIdentity } = helpers.methods;

export function searchForLocalList(videoSrc: string): Promise<LocalSubtitle[]> {
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
          .map(filename => new LocalSubtitle(join(videoDir, filename)))
        );
      }
    });
  });
}

export function fetchOnlineList(videoSrc: string, languageCode: LanguageName, hints: string): Promise<OnlineSubtitle[]> {
  return new Promise((resolve, reject) => {
    calculateMediaIdentity(videoSrc)
      .then(mediaIdentity => Promise.race([
        Sagi.mediaTranslate({ mediaIdentity, languageCode, hints }),
        new Promise((resolve, reject) => setTimeout(() => reject(), 10000)),
      ]))
      .then(response => )
      .catch(err => reject(err));
  });
}

export function retrieveEmbeddedList(videoSrc: string): Promise<EmbeddedSubtitle[]> {
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
        resolve(subtitleStreams.map(stream => new EmbeddedSubtitle(videoSrc, stream)));
      } catch (error) {
        reject(error);
      }
    });
  });
}
