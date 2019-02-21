import { remove, merge, pick } from 'lodash';

import infoDB from '@/helpers/infoDB';
import dataDb from '@/helpers/dataDb';
import { SUBTITLE_OBJECTSTORE_NAME, DATADB_SHCEMAS, DATADB_VERSION } from '@/constants';

function getVideoInfoFromVideoSrc(videoSrc) {
  return infoDB.get('recent-played', 'path', videoSrc);
}
function setVideoInfo(infoPayload) {
  return infoDB.add('recent-played', infoPayload);
}
function updateVideoInfo(videoSrc, info) {
  return getVideoInfoFromVideoSrc(videoSrc).then(videoInfo =>
    setVideoInfo(merge(videoInfo || { path: videoSrc }, info)));
}

export function storeLanguagePreference(videoSrc, languagePreference) {
  return updateVideoInfo(videoSrc, {
    preference: {
      subtitle: {
        language: languagePreference,
      },
    },
  });
}
export function retrieveLanguagePreference(videoSrc) {
  return getVideoInfoFromVideoSrc(videoSrc)
    .then(({ preference }) => (preference ? preference.subtitle.language : []));
}
export function storeSubtitleList(videoSrc, subtitleList) {
  return updateVideoInfo(videoSrc, {
    preference: {
      subtitle: {
        list: subtitleList,
      },
    },
  });
}
export function retrieveSubtitleList(videoSrc) {
  return getVideoInfoFromVideoSrc(videoSrc)
    .then(({ preference }) => (preference ? preference.subtitle.list : []));
}
export async function updateSubtitleList(videoSrc, newSubtitles) {
  if (!(newSubtitles instanceof Array) || !newSubtitles.length) return false;
  const subtitleList = await retrieveSubtitleList(videoSrc);
  newSubtitles.forEach((subtitleInfo) => {
    const { id } = subtitleInfo;
    const existingSubtitleIndex = subtitleList.findIndex(({ id: subtitleId }) => subtitleId === id);
    if (existingSubtitleIndex !== -1) {
      const existingSubtitle = subtitleList[existingSubtitleIndex];
      subtitleList[existingSubtitleIndex] = { ...existingSubtitle, ...subtitleInfo };
    } else {
      subtitleList.push(subtitleInfo);
    }
  });
  return storeSubtitleList(videoSrc, subtitleList);
}

export async function storeSubtitle(subtitle) {
  const supportedProperties = DATADB_SHCEMAS
    .find(({ version }) => version === DATADB_VERSION)
    .schema // find the correct version
    .find(({ name }) => name === SUBTITLE_OBJECTSTORE_NAME) // find the correct objectStore
    .properties;
  const subtitleToStore = pick(subtitle, supportedProperties);
  return dataDb.add(SUBTITLE_OBJECTSTORE_NAME, subtitleToStore);
}
export async function updateSubtitle(subtitleId, subtitleInfo) {
  const existingSubtitle = await dataDb.get(SUBTITLE_OBJECTSTORE_NAME, subtitleId);
  if (!existingSubtitle) return storeSubtitle(subtitleInfo);
  const subtitleToPut = { ...existingSubtitle, ...subtitleInfo };
  return dataDb.put(
    SUBTITLE_OBJECTSTORE_NAME,
    subtitleToPut,
    subtitleId,
  );
}
export async function retrieveSubtitles(mediaIdentity) {
  return dataDb.getAll(SUBTITLE_OBJECTSTORE_NAME, IDBKeyRange.only(mediaIdentity));
}
export async function deleteSubtitles(subtitleIds) {
  if (!(subtitleIds instanceof Array) || !subtitleIds.length) return ({ success: [], failure: [] });
  const success = [];
  const failure = [...subtitleIds];
  const deleteSubtitle = subtitleId => (
    dataDb.delete(SUBTITLE_OBJECTSTORE_NAME, subtitleId)
      .then(() => {
        success.push(subtitleId);
        remove(failure, id => id === subtitleId);
      })
      .catch(console.log)
  );

  await Promise.all(subtitleIds.map(deleteSubtitle));

  return ({ success, failure });
}
