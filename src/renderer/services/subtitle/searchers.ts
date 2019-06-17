import { LocalSubtitle, OnlineSubtitle, EmbeddedSubtitle, ISubtitleStream, subtitleCodecs } from './loaders';
import { dirname, basename, extname, join } from 'path';
import { readdir } from 'fs';
import { LanguageCode } from '@/libs/language';
import { ipcRenderer, Event } from 'electron';
import helpers from '@/helpers';
import Sagi from '@/libs/sagi';
import { subtitleExtensions } from './parsers';

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

export function fetchOnlineList(videoSrc: string, languageCode: LanguageCode, hints: string): Promise<OnlineSubtitle[]> {
  return new Promise((resolve, reject) => {
    calculateMediaIdentity(videoSrc)
      .then(mediaIdentity => Sagi.mediaTranslate({
        mediaIdentity, languageCode, hints,
        format: '', startTime: 0, // tempoary useless params according to server-side
      }))
      .then(response => response.map(transcriptInfo => new OnlineSubtitle(transcriptInfo)))
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
