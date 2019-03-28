import { remove, pick } from 'lodash';

import infoDB from '@/helpers/infoDB';
import dataDb from '@/helpers/dataDb';
import TaskQueue from '@/helpers/proceduralQueue';
import { SUBTITLE_OBJECTSTORE_NAME, DATADB_SHCEMAS, DATADB_VERSION } from '@/constants';

const taskQueues = {};

function getVideoInfoFromVideoSrc(videoSrc) {
  return infoDB.get('recent-played', 'path', videoSrc);
}
function setVideoInfo(infoPayload) {
  return infoDB.add('recent-played', infoPayload);
}
function updateSubtitlePreferenceRaw(videoSrc, preference, isDelete) {
  return getVideoInfoFromVideoSrc(videoSrc).then((videoInfo) => {
    if (!videoInfo) videoInfo = { path: videoSrc };
    if (!videoInfo.preference) videoInfo.preference = {};
    if (!videoInfo.preference.subtitle) videoInfo.preference.subtitle = {};
    const oldPreference = videoInfo.preference.subtitle;
    const newPreference = { ...oldPreference };
    Object.keys(preference).forEach((field) => {
      switch (field) {
        case 'list': {
          const oldList = newPreference.list || [];
          const newList = preference.list;
          if (!isDelete) {
            newList.forEach((subtitle) => {
              const existedIndex = oldList.findIndex(({ id }) => id === subtitle.id);
              if (existedIndex !== -1) {
                const existedSubtitle = oldList[existedIndex];
                oldList[existedIndex] = { ...existedSubtitle, ...subtitle };
              } else oldList.push(subtitle);
            });
          } else {
            remove(oldList, ({ id }) => newList.every(({ id: newId }) => newId !== id));
          }
          newPreference.list = oldList;
          break;
        }
        default:
          newPreference[field] = preference[field];
          break;
      }
    });
    videoInfo.preference.subtitle = newPreference;
    return setVideoInfo(videoInfo);
  });
}
function updateSubtitlePreference(videoSrc, preference, isDelete) {
  if (!taskQueues[videoSrc]) taskQueues[videoSrc] = new TaskQueue();
  return taskQueues[videoSrc]
    .add(() => updateSubtitlePreferenceRaw(videoSrc, preference, isDelete));
}

export function storeLanguagePreference(videoSrc, languagePreference, isDelete) {
  return updateSubtitlePreference(videoSrc, { language: languagePreference }, isDelete);
}
export function retrieveLanguagePreference(videoSrc) {
  return getVideoInfoFromVideoSrc(videoSrc)
    .then(({ preference }) => (preference ? preference.subtitle.language : []));
}
export function storeSubtitleList(videoSrc, subtitleList, isDelete) {
  return updateSubtitlePreference(videoSrc, { list: subtitleList }, isDelete);
}
export async function retrieveSubtitleList(videoSrc) {
  const videoInfo = await getVideoInfoFromVideoSrc(videoSrc);
  const { preference } = videoInfo;
  const isValidArray = val => Array.isArray(val);
  if (!preference) return [];
  if (!preference.subtitle) return [];
  if (!isValidArray(preference.subtitle.list)) return [];
  return preference.subtitle.list;
}
export async function updateSubtitleList(videoSrc, newSubtitles) {
  if (!(newSubtitles instanceof Array) || !newSubtitles.length) return false;
  const subtitleList = [...newSubtitles];
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
export async function retrieveSelectedSubtitleId(videoSrc) {
  return getVideoInfoFromVideoSrc(videoSrc)
    .then(({ preference }) => preference?.subtitle?.selected || {});
}
export async function updateSelectedSubtitleId(videoSrc, Ids) {
  return updateSubtitlePreference(videoSrc, { selected: Ids });
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
  const realSubtitleId = parseInt(subtitleId, 10);
  const existingSubtitle = await dataDb.get(SUBTITLE_OBJECTSTORE_NAME, realSubtitleId);
  if (!existingSubtitle) return storeSubtitle(subtitleInfo);
  const subtitleToPut = { ...existingSubtitle, ...subtitleInfo };
  return dataDb.put(
    SUBTITLE_OBJECTSTORE_NAME,
    subtitleToPut,
    realSubtitleId,
  );
}
export async function retrieveSubtitle(subtitleId) {
  return dataDb.get(SUBTITLE_OBJECTSTORE_NAME, parseInt(subtitleId, 10));
}
export async function deleteSubtitles(subtitleIds, videoSrc) {
  if (!(subtitleIds instanceof Array) || !subtitleIds.length) return ({ success: [], failure: [] });
  subtitleIds = subtitleIds.map(id => parseInt(id, 10));
  const success = [];
  const failure = [...subtitleIds];
  subtitleIds = subtitleIds.map(id => parseInt(id, 10));
  const deleteSubtitle = subtitleId => (
    dataDb.delete(SUBTITLE_OBJECTSTORE_NAME, subtitleId)
      .then(() => {
        success.push(subtitleId);
        remove(failure, id => id === subtitleId);
      })
      .catch(console.log)
  );

  await Promise.all(subtitleIds.map(deleteSubtitle));
  if (videoSrc) {
    const existingIds = await retrieveSubtitleList(videoSrc);
    remove(existingIds, ({ id }) => success.includes(parseInt(id, 10)));
    await storeSubtitleList(videoSrc, existingIds, true);
  }

  return ({ success, failure });
}
