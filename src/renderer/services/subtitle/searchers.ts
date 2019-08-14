import {
  dirname, extname, basename, join,
} from 'path';
import { readdir } from 'fs';
import { pathToFormat } from './utils';
import { LanguageCode } from '@/libs/language';
import { mediaQuickHash as calculateMediaIdentity } from '@/libs/utils';
import Sagi from '@/libs/sagi';
import { Format } from '@/interfaces/ISubtitle';
import { getSubtitleStreams, ISubtitleStream } from '@/plugins/mediaTasks';

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
  languageCode: LanguageCode = LanguageCode.Default,
  hints?: string,
) {
  if (
    !languageCode
    || languageCode === LanguageCode.Default
    || languageCode === LanguageCode.No
  ) return [];
  const mediaIdentity = await calculateMediaIdentity.try(videoSrc);
  return mediaIdentity ? Sagi.mediaTranslate({
    mediaIdentity,
    languageCode,
    hints: hints || basename(videoSrc, extname(videoSrc)),
    format: '',
    startTime: 0, // tempoary useless params according to server-side
  }).catch(() => []) : [];
}

export function retrieveEmbeddedList(
  videoSrc: string,
  excludedStreamIndexes: number[] = [],
): Promise<[string, ISubtitleStream][]> {
  return getSubtitleStreams(videoSrc).then(streams => streams
    .filter(({ index }) => !excludedStreamIndexes.includes(index))
    .filter(({ codecName }) => Object.values(Format).includes(codecName))
    .map(stream => [videoSrc, stream]));
}
