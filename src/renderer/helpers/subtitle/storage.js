import infoDB from '@/helpers/infoDB';

function getVideoInfoFromVideoSrc(videoSrc) {
  return infoDB.get('recent-played', 'path', videoSrc);
}
function setVideoInfo(infoPayload) {
  return infoDB.add('recent-played', infoPayload);
}
function updateVideoInfo(videoSrc, info) {
  return getVideoInfoFromVideoSrc(videoSrc)
    .then((videoInfo) => setVideoInfo({ ...(videoInfo || { path: videoSrc }), ...info }));
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
