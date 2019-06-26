import { EmbeddedGenerator, ISubtitleStream } from './loaders';
import { dirname, extname, basename, join } from 'path';
import { pathToFormat } from './utils';
import { readdir } from 'fs';
import { LanguageCode } from '@/libs/language';
import { ipcRenderer, Event } from 'electron';
import helpers from '@/helpers';
import Sagi from '@/libs/sagi';
import { Format } from '@/interfaces/ISubtitle';

const { mediaQuickHash: calculateMediaIdentity } = helpers.methods;

export function searchForLocalList(videoSrc: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const videoDir = dirname(videoSrc);
    const videoBasename = basename(videoSrc, extname(videoSrc));
    const isValidSubtitle = (filename: string) => {
      const subtitleBasename = basename(filename, extname(filename));
      return (
        pathToFormat(filename) &&
        subtitleBasename.toLowerCase() === videoBasename.toLowerCase()
      )
    };

    readdir(videoDir, (err, files) => {
      if (err) reject(err);
      else {
        resolve(files
          .filter(isValidSubtitle)
          .map(filename => join(videoDir, filename))
        );
      }
    });
  });
}

export async function fetchOnlineList(
  videoSrc: string,
  languageCode: LanguageCode = LanguageCode["zh-CN"],
  hints?: string,
) {
  if (languageCode === LanguageCode.Default || languageCode === LanguageCode.No) return [];
  const mediaIdentity = await calculateMediaIdentity(videoSrc);
  return Sagi.mediaTranslate({
    mediaIdentity, languageCode, hints: hints || basename(videoSrc, extname(videoSrc)),
    format: '', startTime: 0, // tempoary useless params according to server-side
  });
}

export function retrieveEmbeddedList(
  videoSrc: string,
  excludedStreamIndexes: number[] = [],
): Promise<[string, ISubtitleStream][]> {
  ipcRenderer.send('mediaInfo', videoSrc);
  return new Promise((resolve, reject) => {
    setTimeout(() => { reject(new Error('Embedded Subtitles Retrieve Timeout!')); }, 20000);
    ipcRenderer.once(`mediaInfo-${videoSrc}-reply`, (event: Event, info: string) => {
      try {
        const subtitleStreams: ISubtitleStream[] = JSON.parse(info).streams
          .filter((stream: ISubtitleStream) => (
            !excludedStreamIndexes.includes(stream.index) &&
            stream.codec_type === 'subtitle' &&
            Object.values(Format).includes(stream.codec_name)
          ));
        resolve(subtitleStreams.map(stream => [videoSrc, stream]));
      } catch (error) {
        reject(error);
      }
    });
  });
}
