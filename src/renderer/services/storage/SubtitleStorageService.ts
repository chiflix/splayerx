import {
  get, merge, union, remove,
} from 'lodash';
import {
  MediaItem, SubtitleDataItem, SubtitlePreference, SubtitlePreferenceListItem, SubtitlePreferenceLanguage,
} from '@/interfaces/IDB';
import { info, data } from '@/libs/DataBase';
import { SUBTITLE_OBJECTSTORE_NAME } from '@/constants';
import TaskQueue from '@/helpers/proceduralQueue';

async function getVideoInfoByVideoSrc(videoSrc: string): Promise<MediaItem | undefined> {
  let result;
  try {
    result = await info.getValueByIndex('recent-played', 'path', videoSrc);
  } catch (e) {
    result = await info.getValueByIndex('media-item', 'path', videoSrc);
  }
  return result;
}
async function setVideoInfo(videoInfo: MediaItem) {
  if (videoInfo.videoId) {
    return info.update('media-item', videoInfo.videoId, videoInfo);
  }
  return info.add('media-item', videoInfo);
}

class SubtitleStorageService {
  public addSubtitle(subtitle: SubtitleDataItem) {
    return data.add(SUBTITLE_OBJECTSTORE_NAME, subtitle);
  }

  public updateSubtitle(id: number, subtitle: SubtitleDataItem) {
    return data.update(SUBTITLE_OBJECTSTORE_NAME, id, subtitle);
  }

  public deleteSubtitle(id: number) {
    return data.delete(SUBTITLE_OBJECTSTORE_NAME, id);
  }

  public retrieveSubtitle(id: number): Promise<SubtitleDataItem | undefined> {
    return data.getValueByKey(SUBTITLE_OBJECTSTORE_NAME, id);
  }

  private lastPreferenceOperationId = 0;

  private lastPreference = {
    operationId: -1,
    preference: {} as SubtitlePreference,
    videoInfo: {} as MediaItem,
  };

  private async retrievePreference(videoSrc: string) {
    if (this.lastPreferenceOperationId === this.lastPreference.operationId) {
      return this.lastPreference.preference;
    }
    const videoInfo = await getVideoInfoByVideoSrc(videoSrc);
    const preference = get(videoInfo, ['preference', 'subtitle']) as (SubtitlePreference | undefined);
    if (videoInfo && preference) {
      this.lastPreference = {
        operationId: this.lastPreferenceOperationId,
        preference,
        videoInfo,
      };
    }
    return preference;
  }

  private async storePreferenceRaw(videoSrc: string, preference: SubtitlePreference) {
    const oldPreference = await this.retrievePreference(videoSrc);
    if (!oldPreference) {
      this.lastPreferenceOperationId += 1;
      const { videoInfo, preference } = this.lastPreference;
      const newVideoInfo = merge(
        videoInfo,
        {
          preference: {
            subtitle: preference,
          },
        },
      );
      return setVideoInfo(newVideoInfo);
    }
  }

  private preferenceQueues: { [videoSrc: string]: TaskQueue };

  private async storePreference(videoSrc: string, preference: SubtitlePreference) {
    const queue = this.preferenceQueues[videoSrc]
      ? this.preferenceQueues[videoSrc]
      : this.preferenceQueues[videoSrc] = new TaskQueue();
    return queue.add(() => this.storePreferenceRaw(videoSrc, preference));
  }

  public async retrieveLanguagePreference(videoSrc: string) {
    const preference = await this.retrievePreference(videoSrc);
    if (preference && preference.language) return preference.language;
  }

  public async storeLanguagePreference(videoSrc: string, languagePreference: SubtitlePreferenceLanguage) {
    const preference = await this.retrievePreference(videoSrc);
    const newPreference = merge(
      preference,
      {
        language: languagePreference,
      },
    );
    return this.storePreference(videoSrc, newPreference);
  }

  public async retrieveSubtitleList(videoSrc: string) {
    const preference = await this.retrievePreference(videoSrc);
    if (preference && preference.list) return preference.list;
  }

  private async storeSubtitleList(videoSrc: string, subtitleList: SubtitlePreferenceListItem[]) {
    const preference = await this.retrievePreference(videoSrc);
    const newPreference = merge(
      preference,
      {
        list: subtitleList,
      },
    );
    return this.storePreference(videoSrc, newPreference);
  }

  public async addSubtitlesToList(videoSrc: string, subtitleList: SubtitlePreferenceListItem[]) {
    const oldSubtitleList = await this.retrieveSubtitleList(videoSrc) || [];
    const newSubtitleList = union(oldSubtitleList, subtitleList);
    return this.storeSubtitleList(videoSrc, newSubtitleList);
  }

  public async deleteSubtitlesFromList(videoSrc: string, subtitlesToDelete: SubtitlePreferenceListItem[]) {
    const subtitleList = await this.retrieveSubtitleList(videoSrc) || [];
    remove(subtitleList, subtitle => subtitlesToDelete.includes(subtitle));
    return this.storeSubtitleList(videoSrc, subtitleList);
  }

  public async retrieveFirstSelectedSubtitleId(videoSrc: string) {
    const preference = await this.retrievePreference(videoSrc);
    if (preference && preference.selected) return preference.selected.firstId;
  }

  public async storeFirstSelectedSubtitleId(videoSrc: string, id: number) {
    const preference = await this.retrievePreference(videoSrc);
    const newPreference = merge(
      preference,
      {
        selected: {
          firstId: id,
        },
      },
    );
    return this.storePreference(videoSrc, newPreference);
  }

  public async retrieveSecondSelectedSubtitleId(videoSrc: string) {
    const preference = await this.retrievePreference(videoSrc);
    if (preference && preference.selected) return preference.selected.secondaryId;
  }

  public async storeSecondSelectedSubtitleId(videoSrc: string, id: number) {
    const preference = await this.retrievePreference(videoSrc);
    const newPreference = merge(
      preference,
      {
        selected: {
          secondaryId: id,
        },
      },
    );
    return this.storePreference(videoSrc, newPreference);
  }
}

export default new SubtitleStorageService();
