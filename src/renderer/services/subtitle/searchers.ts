import {
  dirname, extname, basename, join,
} from 'path';
import { readdir } from 'fs';
import { ipcRenderer, Event } from 'electron';
import { SubtitleStream } from './loaders';
import { pathToFormat } from './utils';
import { LanguageCode } from '@/libs/language';
import { mediaQuickHash as calculateMediaIdentity } from '@/libs/utils';
import Sagi from '@/libs/sagi';
import { Format } from '@/interfaces/ISubtitle';

export function searchForLocalList(videoSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const videoDir = dirname(videoSrc);
    const videoBasename = basename(videoSrc, extname(videoSrc));
    const isValidSubtitle = (filename: string) => {
      const subtitleBasename = basename(filename, extname(filename));
      return (
        pathToFormat(filename) !== Format.Unknown
        && subtitleBasename.toLowerCase() === videoBasename.toLowerCase()
      );
    };

    readdir(videoDir, (err, files) => {
      if (err) {
        // reject(err);
        resolve([]);
      } else {
        resolve(files
          .filter(isValidSubtitle)
          .map(filename => join(videoDir, filename)));
      }
    });
  });
}

export async function fetchOnlineList(
  videoSrc: string,
  languageCode: LanguageCode = LanguageCode['zh-CN'],
  hints?: string,
) {
  if (
    !languageCode
    || languageCode === LanguageCode.Default
    || languageCode === LanguageCode.No
  ) return [];
  const mediaIdentity = await calculateMediaIdentity(videoSrc);
  return Sagi.mediaTranslate({
    mediaIdentity,
    languageCode,
    hints: hints || basename(videoSrc, extname(videoSrc)),
    format: '',
    startTime: 0, // tempoary useless params according to server-side
  }).catch(() => []);
}

export function retrieveEmbeddedList(
  videoSrc: string,
  excludedStreamIndexes: number[] = [],
): Promise<[string, SubtitleStream][]> {
  ipcRenderer.send('mediaInfo', videoSrc);
  return new Promise((resolve) => {
    const timeout = setTimeout(() => { resolve([]); }, 20000);
    ipcRenderer.once(`mediaInfo-${videoSrc}-reply`, (event: Event, info: string) => {
      clearTimeout(timeout);
      try {
        const subtitleStreams: SubtitleStream[] = JSON.parse(info).streams
          .filter((stream: SubtitleStream) => (
            !excludedStreamIndexes.includes(stream.index)
            && stream.codec_type === 'subtitle'
            && Object.values(Format).includes(stream.codec_name)
          ));
        resolve(subtitleStreams.map(stream => [videoSrc, stream]));
      } catch (error) {
        // reject(error);
        resolve([]);
      }
    });
  });
}
