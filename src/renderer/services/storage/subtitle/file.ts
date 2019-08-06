import {
  join, extname, dirname, basename,
} from 'path';
import { remote } from 'electron';
import {
  copyFile, existsSync, outputFile, ensureDirSync, remove, readdir,
} from 'fs-extra';
import {
  Entity, IOrigin, Type, Format,
} from '@/interfaces/ISubtitle';
import { embeddedSrcLoader, IEmbeddedOrigin, SagiSubtitlePayload } from '@/services/subtitle';
import { sagiSubtitleToWebVTT } from '@/services/subtitle/utils/transcoders';
import { updateSubtitle } from '.';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_DIRNAME, SUBTITLE_DIRNAME } from '@/constants';
import { formatToExtension } from '@/services/subtitle/utils';

const { app } = remote;

const subtitleCacheDirPath = join(
  app.getPath(ELECTRON_CACHE_DIRNAME),
  DEFAULT_DIRNAME,
  SUBTITLE_DIRNAME,
);
/** copy the subtitle from the src to cacheFileStorage */
export async function cacheLocalSubtitle(subtitle: Entity): Promise<IOrigin> {
  const { source, hash } = subtitle;
  const storedPath = join(subtitleCacheDirPath, `${hash}${extname(source.source as string)}`);
  ensureDirSync(subtitleCacheDirPath);
  if (!existsSync(storedPath)) await copyFile(source.source as string, storedPath);
  return {
    type: Type.Local,
    source: storedPath,
  };
}
/** copy the subtitle if extracted */
export async function cacheEmbeddedSubtitle(subtitle: Entity): Promise<IOrigin> {
  const { hash } = subtitle;
  const storedPath = join(subtitleCacheDirPath, `${hash}.${Format.AdvancedSubStationAplha}`);
  const { extractedSrc, videoSrc, streamIndex } = (subtitle.source as IEmbeddedOrigin).source;
  const srcPath = extractedSrc || await embeddedSrcLoader(videoSrc, streamIndex);
  ensureDirSync(subtitleCacheDirPath);
  if (!existsSync(srcPath)) await copyFile(srcPath, storedPath);
  return {
    type: Type.Local,
    source: storedPath,
  };
}
/** convert payload to WebVTT subtitle and cache it */
export async function cacheOnlineSubtitle(subtitle: Entity): Promise<IOrigin | undefined> {
  const { hash, payload } = subtitle;
  if (payload) {
    const storedPath = join(subtitleCacheDirPath, `${hash}.${formatToExtension(subtitle.format)}`);
    if (!existsSync(storedPath)) {
      await outputFile(storedPath, sagiSubtitleToWebVTT(payload as SagiSubtitlePayload));
    }
    return {
      type: Type.Local,
      source: storedPath,
    };
  }
  return undefined;
}

export async function removeCachedSubtitle(hash: string) {
  ensureDirSync(subtitleCacheDirPath);
  const cachedSubtitlePath = (await readdir(subtitleCacheDirPath))
    .find(path => basename(path).startsWith(hash));
  if (cachedSubtitlePath && existsSync(cachedSubtitlePath)) {
    await remove(cachedSubtitlePath);
    return {
      type: Type.Local,
      source: cachedSubtitlePath,
    };
  }
  return '';
}

export async function removeCachedSubtitles(
  hashes: string[],
): Promise<{ hash: string, source: IOrigin }[]> {
  const cachedSubtitlePaths = (await readdir(subtitleCacheDirPath))
    .filter(path => hashes.includes(basename(path, extname(path))))
    .map(basepath => join(subtitleCacheDirPath, basepath));
  return Promise.all(cachedSubtitlePaths.map(async (path) => {
    await remove(path);
    return {
      hash: basename(path, extname(path)),
      source: {
        type: Type.Local,
        source: path,
      },
    };
  }));
}

/** update subtitle database with new origin */
export function addNewSourceToDb(subtitle: Entity, newSource: IOrigin) {
  subtitle.source = newSource;
  return updateSubtitle(subtitle);
}

export function isCachedSubtitle(subtitleSource: IOrigin) {
  const { type, source } = subtitleSource;
  return type === Type.Local && typeof source === 'string' && existsSync(source) && dirname(source) === subtitleCacheDirPath;
}
