import IRecentPlay, { LandingViewDisplayInfo } from '@/interfaces/IRecentPlay';
import { mediaStorageService } from '@/services/storage/MediaStorageService';
import { basename, extname } from 'path';
import { playInfoStorageService } from '@/services/storage/PlayInfoStorageService';
import { info } from '@/libs/DataBase';
import { mediaQuickHash } from '@/libs/utils';
import { filePathToUrl } from '@/helpers/path';
export default class RecentPlayService implements IRecentPlay {
  constructor() {
  }
  async getRecords(): Promise<LandingViewDisplayInfo[]> {
    const recentPlayedResults = await playInfoStorageService.getAllRecentPlayed();
    const coverVideos = (await Promise.all(
      recentPlayedResults.map(async (value) => {
        const { items, playedIndex, id } = value;
        const coverVideoId = items[playedIndex] as number;
        if (!coverVideoId) return null;
        const mediaItem = await info.getValueByKey('media-item', coverVideoId);
        if (!mediaItem) return null; // TODO: figure out why it wasn't saved to media-item

        return {
          ...mediaItem,
          id,
          playedIndex,
          playlistLength: items.length,
        };
      })
    )).filter((item) => !!item);
    const getBasename = (path: string) => basename(path, extname(path));
    const results: LandingViewDisplayInfo[] = await Promise.all(
      coverVideos.map(async (item: any): Promise<LandingViewDisplayInfo> => {
        const { lastPlayedTime, duration, path, playedIndex, playlistLength, shortCut, id } = item;
        const percentage = (lastPlayedTime / duration) * 100;
        let backgroundUrl;

        if (duration - lastPlayedTime < 5) {
          const mediaHash = await mediaQuickHash(path);
          const coverSrc = await mediaStorageService.getImageBy(mediaHash, 'cover');
          backgroundUrl = `url("${filePathToUrl(coverSrc as string)}")`;
        } else {
          backgroundUrl = `url("${shortCut}")`
        }

        const basename = getBasename(item.path);
        return {
          id,
          basename,
          lastPlayedTime,
          duration,
          percentage,
          path,
          backgroundUrl,
          playedIndex,
          playlistLength,
        };
      }));
    return results.splice(0, 9);
  }
}

export const recentPlayService = new RecentPlayService();
