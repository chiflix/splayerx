import { Entity, Origin, Type } from '@/interfaces/ISubtitle';
import { join, extname, dirname, basename } from 'path';
import { remote } from 'electron';
import { copyFile, existsSync, outputFile, ensureDirSync, remove, readdir } from 'fs-extra';
import { embeddedSrcLoader, EmbeddedOrigin } from '@/services/subtitle';
import { sagiSubtitleToWebVTT } from '@/services/subtitle/utils/transcoders';
import { updateSubtitle } from '.';
import { ELECTRON_CACHE_DIRNAME, DEFAULT_DIRNAME, SUBTITLE_DIRNAME } from '@/constants';
import { formatToExtension } from '@/services/subtitle/utils';

const { app } = remote;

const subtitleCachePath = join(app.getPath(ELECTRON_CACHE_DIRNAME), DEFAULT_DIRNAME, SUBTITLE_DIRNAME);
/** copy the subtitle from the src to cacheFileStorage */
export async function cacheLocalSubtitle(subtitle: Entity): Promise<Origin> {
  const { source, hash } = subtitle;
  const storedPath = join(subtitleCachePath, `${hash}${extname(source.source)}`);
  ensureDirSync(subtitleCachePath);
  if (!existsSync(storedPath)) await copyFile(source.source, storedPath);
  return {
    type: Type.Local,
    source: storedPath,
  };
}
/** copy the subtitle if extracted */
export async function cacheEmbeddedSubtitle(subtitle: Entity): Promise<Origin> {
  const { hash, format } = subtitle;
  const storedPath = join(subtitleCachePath, `${hash}.${formatToExtension(subtitle.format)}`);
  const { extractedSrc, videoSrc, streamIndex } = (subtitle.source as EmbeddedOrigin).source;
  const srcPath = extractedSrc || await embeddedSrcLoader(videoSrc, streamIndex, format);
  ensureDirSync(subtitleCachePath);
  if (!existsSync(srcPath)) await copyFile(srcPath, storedPath);
  return {
    type: Type.Local,
    source: storedPath,
  };
}
/** convert payload to WebVTT subtitle and cache it */
export async function cacheOnlineSubtitle(subtitle: Entity): Promise<Origin | undefined> {
  const { hash, payload } = subtitle;
  if (payload) {
    const storedPath = join(subtitleCachePath, `${hash}.${formatToExtension(subtitle.format)}`);
    if (!existsSync(storedPath)) await outputFile(storedPath, sagiSubtitleToWebVTT(payload));
    return {
      type: Type.Local,
      source: storedPath,
    };
  }
}

export async function removeCachedSubtitle(hash: string) {
  const cachedSubtitlePath = (await readdir(subtitleCachePath))
    .find(path => basename(path).startsWith(hash));
  if (cachedSubtitlePath && existsSync(cachedSubtitlePath)) {
    await remove(cachedSubtitlePath);
    return {
      type: Type.Local,
      source: cachedSubtitlePath,
    };
  }
}

export async function removeCachedSubtitles(hashes: string[]): Promise<{ hash: string, source: Origin }[]> {
  const cachedSubtitlePaths = (await readdir(subtitleCachePath))
    .filter(path => hashes.includes(basename(path, extname(path))))
    .map(basepath => join(subtitleCachePath, basepath));
  return Promise.all(cachedSubtitlePaths.map(async path => {
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
export function addNewSourceToDb(subtitle: Entity, newSource: Origin) {
  subtitle.source = newSource;
  return updateSubtitle(subtitle);
}

export function isCachedSubtitle(subtitleSource: Origin) {
  const { type, source } = subtitleSource;
  return type === Type.Local && typeof source === 'string' && existsSync(source) && dirname(source) === subtitleCachePath;
}
