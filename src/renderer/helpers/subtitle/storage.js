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
  const subtitleIdKeyRange = IDBKeyRange.only(subtitleId);
  const existingSubtitles = await dataDb.getAll(SUBTITLE_OBJECTSTORE_NAME, subtitleIdKeyRange);
  if (!existingSubtitles.length) return storeSubtitle(subtitleInfo);
  const chooseSubtitleToUpdate = (subtitles) => {
    const subtitlesWithLastOpened = subtitles.filter(({ lastOpened }) => !!lastOpened);
    if (subtitlesWithLastOpened.length) {
      const subtitleSortedByLastOpened = subtitlesWithLastOpened
        .sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime());
      return subtitleSortedByLastOpened[0];
    }
    return subtitles[0];
  };
  const subtitleToUpdate = { ...chooseSubtitleToUpdate(existingSubtitles), ...subtitleInfo };
  return dataDb.put(
    SUBTITLE_OBJECTSTORE_NAME,
    subtitleToUpdate,
    subtitleToUpdate._id, // eslint-disable-line no-underscore-dangle
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
