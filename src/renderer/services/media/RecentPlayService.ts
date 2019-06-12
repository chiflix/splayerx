import { IRecentPlayRequest, RecentPlayInfo } from '@/interfaces/containers/IRecentPlayRequest';
import MediaStorageService, { mediaStorageService } from '@/services/storage/MediaStorageService';
import { ipcRenderer } from 'electron';
import store from '@/store/index';
import { basename, join, dirname, extname } from 'path';
import { getValidVideoRegex } from '@/../shared/utils';
import { promises as fsPromises } from 'fs';
import { mediaQuickHash } from "@/helpers/utils";
import { info } from '@/libs/DataBase'
import { PlaylistItem } from '@/interfaces/services/IDB';
import infoDB from '@/helpers/infoDB';

type RecentPlayItem = {
  name: string,
  image: string,
  progress: number,
}
type MediaInfo = {
  path: string,
  duration: number,
  cover: string, // path
  shortcut: string, // base64 string
  lastPlayedTime: number,
}

export default class RecentPlayService implements IRecentPlayRequest {
  public playlist: MediaInfo [];
  public currentVideo: string;

  constructor(private readonly mediaStorageService: MediaStorageService) {
  }

  async init(playlistId: number, detectFolder: boolean, currentVideo: string) {
    currentVideo = this.currentVideo;
    const playlist = await info.getValueByKey('recent-played', playlistId);
    if (playlist.item.length > 1) {
      for (const mediaItemId of playlist.items) {
        const mediaItem = await info.getValueByKey('media-item', mediaItemId);
        playlist.push(mediaItem);
      }
    } else {
      const mediaItem = await info.getValueByKey('media-item', playlist.items[0]);
      const results = await this.findSimilarVideoByVidPath(mediaItem.path);
    }
    // get media info
    // get covers
    // get video records - folder branch & playlist branch
  }
  async findSimilarVideoByVidPath(vidPath: string) {
    vidPath = decodeURI(vidPath);

    if (process.platform === 'win32') {
      vidPath = vidPath.replace(/^file:\/\/\//, '');
    } else {
      vidPath = vidPath.replace(/^file:\/\//, '');
    }

    const dirPath = dirname(vidPath);

    const videoFiles: string[] = [];
    const files = await fsPromises.readdir(dirPath);
    const tasks = [];
    for (let i = 0; i < files.length; i += 1) {
      const filename = join(dirPath, files[i]);
      tasks.push(fsPromises.lstat(filename).then((stat) => {
        const fileBaseName = basename(filename);
        if (!stat.isDirectory() && !fileBaseName.startsWith('.')) {
          if (getValidVideoRegex().test(extname(fileBaseName))) {
            videoFiles.push(fileBaseName);
          }
        }
      }));
    }
    await Promise.all(tasks);
    videoFiles.sort();
    videoFiles.map(src => join(dirPath, src));

    return videoFiles;
  }
   /**
   * @param  {string} mediaHash
   * @returns Promise 返回视频封面图片
   */
  async getCover(mediaHash: string): Promise<string | null> {
    try {
      const result = await this.mediaStorageService.getImageBy(mediaHash, 'cover');
      return result;
    } catch(err) {
      return null; 
    }
  }
  async getMediaInfo(videoPath: string): Promise<MediaInfo> {
    return new Promise((resolve, j) => {
      ipcRenderer.send('mediaInfo', videoPath);
      ipcRenderer.once(`mediaInfo-${videoPath}-reply`, async (event: any, info: string) => {
        const format: MediaInfo = JSON.parse(info).format;
        this.playlist.find(video => video.path === videoPath);
      });
    });
  }
  /**
   * @param  {string} mediaHash
   * @param  {string} videoSrc
   * @param  {number} width
   * @param  {number} height
   * @param  {number} duration
   * @returns Promise 图片地址
   */
  async generateCover(mediaHash: string, videoSrc: string, width: number, height: number, duration: number): Promise<string> {
    try {
      const gpath = await this.mediaStorageService.generatePathBy(mediaHash, 'cover');
      if (gpath) {
        const info = {
          src: videoSrc,
          imgPath: gpath,
          duration,
          width,
          height,
        };
        ipcRenderer.send('snapShot', info);
        return gpath;
      }
    } catch (err) {
    }
    return '';
  }

  async generatePlaylistCovers(playlist: string[]): Promise<RecentPlayInfo[]> {
    const covers: RecentPlayInfo[] = [];
    playlist.forEach(async (src) => {
      // getMediaInfo
      // getCover
      // generateCover if no result
      const mediaHash: string = await mediaQuickHash(src);
      const mediaInfo = await this.getMediaInfo(src);
      const duration = mediaInfo.duration;
      const result: string | null = await this.getCover(mediaHash);
      let cover: string;
      if (!result) {
        cover = await this.generateCover(mediaHash, src, 0, 0, mediaInfo.duration);
      } else {
        cover = result;
      }
      const info: RecentPlayInfo = {
        src,
        mediaHash,
        cover,
        duration,
      }
      covers.push(info);
    });
    return covers;
  }
  /**
   * @param  {number} videoId
   * @returns Promise 获取播放记录
   */
  async getRecord(videoId: number): Promise<object | null> {
    return {};
  }

  async setPlaylist(playlistId: number, paths: string[]): Promise<void> {
    const result = await info.getValueByKey('recent-played', playlistId);
    const playlist = result as PlaylistItem;
    const currentVideoId = playlist.items[0];
    const currentVideoHp = playlist.hpaths[0];
    const items = [];
    const hpaths = [];
    /* eslint-disable */
    for (const videoPath of paths) {
      if (videoPath !== this.currentVideo) {
        const quickHash = await mediaQuickHash(videoPath);
        const data = {
          quickHash,
          type: 'video',
          path: videoPath,
          source: 'playlist',
        };
        const videoId = await info.add('media-item', data);
        items.push(videoId);
        hpaths.push(`${quickHash}-${videoPath}`);
      } else {
        items.push(currentVideoId);
        hpaths.push(currentVideoHp);
      }
    }
    playlist.items = items;
    playlist.hpaths = hpaths;
    info.update('recent-played', playlist.id, playlist);
  }
}

export const recentPlayService = new RecentPlayService(mediaStorageService);