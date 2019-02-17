import { remove } from 'lodash';

import infoDB from '@/helpers/infoDB';
import dataDb from '@/helpers/dataDb';
import { SUBTITLE_OBJECTSTORE_NAME } from '@/constants';

function getVideoInfoFromVideoSrc(videoSrc) {
  return infoDB.get('recent-played', 'path', videoSrc);
}
function setVideoInfo(infoPayload) {
  return infoDB.add('recent-played', infoPayload);
}
function updateVideoInfo(videoSrc, info) {
  return getVideoInfoFromVideoSrc(videoSrc)
    .then(videoInfo => setVideoInfo({ ...(videoInfo || { path: videoSrc }), ...info }));
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

export async function retrieveLanguagePreference(videoSrc) {
  return (await getVideoInfoFromVideoSrc(videoSrc)).preference.subtitle.language;
}

export async function storeSubtitles(subtitles) {
  const successIds = [];
  const failureIds = subtitles.map(({ id }) => id);
  const storeSubtitle = subtitle => (
    dataDb.add(SUBTITLE_OBJECTSTORE_NAME, subtitle)
      .then(() => {
        successIds.push(subtitle.id);
        remove(failureIds, id => id === subtitle.id);
      })
      .catch(console.log)
  );
  await Promise.all(subtitles.map(storeSubtitle));
  return ({ success: successIds, failure: failureIds });
}
