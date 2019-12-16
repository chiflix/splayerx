import { ipcMain, splayerx, Event } from 'electron';
import { existsSync } from 'fs';

function reply(event: Event, channel: string, ...args: unknown[]) {
  if (event.sender && !event.sender.isDestroyed()) event.reply(channel, ...args);
}

/**
 * Proxied splayerx module to prevent main process crash
 */
const splayerxProxy = new Proxy(splayerx, {
  get(obj, prop) {
    if (!(prop in obj)) return undefined;
    const originMember = obj[prop];
    if (typeof originMember === 'function') {
      const proxiedFunction = function proxiedFunction(...args: unknown[]) {
        try {
          return originMember.apply(obj, args);
        } catch (ex) {
          console.error(ex, prop, args);
          return undefined;
        }
      };
      return proxiedFunction.bind(obj);
    }
    return originMember;
  },
});

export default function registerMediaTasks() {
  ipcMain.on('media-info-request', (event, path) => {
    if (existsSync(path)) {
      splayerxProxy.getMediaInfo(path, info => reply(event, 'media-info-reply', null, info));
    } else {
      reply(event, 'media-info-reply', 'File does not exist.');
    }
  });
  ipcMain.on('snapshot-request', (event,
    videoPath, imagePath,
    timeString,
    width, height) => {
    if (existsSync(imagePath)) {
      reply(event, 'snapshot-reply', null, imagePath);
    } else if (existsSync(videoPath)) {
      splayerxProxy.snapshotVideo(
        videoPath, imagePath,
        timeString,
        width.toString(), height.toString(),
        (err) => {
          setTimeout(() => { // fix "Waiting for the task completion." from electron.splayerx
            if (err === '0' && existsSync(imagePath)) {
              reply(event, 'snapshot-reply', null, imagePath);
            } else {
              if (typeof err !== 'string') err = `${err}, type: ${typeof err}`;
              reply(event, 'snapshot-reply', `snapshot-reply: ${err}`);
            }
          }, 5);
        },
      );
    } else {
      reply(event, 'snapshot-reply', 'File does not exist.');
    }
  });
  let lastVideoPath = '';
  let lastStreamIndex = -1;
  const videoSubtitlesMap: Map<string, Map<number, {
    path: string;
    metadata: string;
    payload: string;
    position: number;
    finished: boolean;
    lastLines: string[];
  }>> = new Map();
  ipcMain.on('subtitle-metadata-request', async (event: Event, videoPath: string, streamIndex: number, subtitlePath: string) => {
    if ((lastVideoPath || lastStreamIndex !== -1)
      && (lastVideoPath !== videoPath || lastStreamIndex !== streamIndex)) {
      await splayerxProxy.stopExtractSubtitles();
    }
    lastVideoPath = videoPath;
    lastStreamIndex = streamIndex;
    if (!videoSubtitlesMap.has(videoPath)) videoSubtitlesMap.set(videoPath, new Map());
    const streamSubtitlesMap = videoSubtitlesMap.get(videoPath);
    if (streamSubtitlesMap) {
      const subtitle = streamSubtitlesMap.get(streamIndex) || {
        path: subtitlePath,
        metadata: '',
        payload: '',
        position: 0,
        finished: false,
        lastLines: [],
      };
      if (existsSync(subtitlePath) || subtitle.finished) {
        subtitle.finished = true;
        reply(event, 'subtitle-metadata-reply', undefined, subtitle.finished);
      } else if (!subtitle.metadata) {
        splayerxProxy.extractSubtitles(videoPath, streamIndex, 0, false, 1,
          (error, pos, pngType, data) => {
            if (error || !data) {
              reply(event, 'subtitle-metadata-reply', new Error(error || 'Missing subtitle data.'));
            } else {
              subtitle.position = pos;
              subtitle.payload = subtitle.metadata = data.toString()
                .replace(/\n(Dialogue|Comment)[\s\S]*/g, '')
                .split(/\r?\n/)
                .join('\n');
            }
            reply(event, 'subtitle-metadata-reply', undefined, subtitle.finished, subtitle.metadata);
          });
      } else {
        reply(event, 'subtitle-metadata-reply', undefined, subtitle.finished, subtitle.metadata);
      }
      streamSubtitlesMap.set(streamIndex, subtitle);
    }
  });
  ipcMain.on('subtitle-cache-request', async (event: Event, videoPath: string, streamIndex: number) => {
    if ((lastVideoPath || lastStreamIndex !== -1)
      && (lastVideoPath !== videoPath || lastStreamIndex !== streamIndex)) {
      await splayerxProxy.stopExtractSubtitles();
    }
    lastVideoPath = videoPath;
    lastStreamIndex = streamIndex;
    const streamSubtitlesMap = videoSubtitlesMap.get(videoPath);
    if (streamSubtitlesMap) {
      const subtitle = streamSubtitlesMap.get(streamIndex);
      if (subtitle) {
        splayerxProxy.extractSubtitles(videoPath, streamIndex, subtitle.position, false, 20,
          (error, pos, pngType, data) => {
            if (pos) subtitle.position = pos;
            if (data) {
              const newLines = data.toString().split(/\r?\n/);
              const finalPayload = newLines.filter(line => !subtitle.lastLines.includes(line)).join('\n');
              subtitle.lastLines = newLines;
              subtitle.payload += `\n${finalPayload}`;
            }
            if (error === 'EOF') {
              subtitle.finished = true;
              reply(event, 'subtitle-cache-reply', undefined, subtitle.finished, subtitle.payload);
            } else if (error) {
              reply(event, 'subtitle-cache-reply', new Error(error));
            } else {
              reply(event, 'subtitle-cache-reply', undefined, subtitle.finished);
            }
          });
        streamSubtitlesMap.set(streamIndex, subtitle);
      } else reply(event, 'subtitle-cache-reply', new Error('Missing subtitle entry, should request metadata first.'));
    } else reply(event, 'subtitle-cache-reply', new Error('Missing videoPath entry, should request metadata first.'));
  });
  ipcMain.on('subtitle-stream-request', (event: Event, videoPath: string, streamIndex: number, time: number) => {
    const streamSubtitlesMap = videoSubtitlesMap.get(videoPath);
    if (streamSubtitlesMap) {
      const subtitle = streamSubtitlesMap.get(streamIndex);
      if (subtitle) {
        splayerxProxy.extractSubtitles(videoPath, streamIndex, time, true, 20,
          (error, pos, pngType, data) => {
            if (data) {
              reply(event, 'subtitle-stream-reply', undefined, data.toString());
            } else {
              reply(event, 'subtitle-stream-reply', new Error(!error || !data ? 'Missing subtitle data' : error));
            }
          });
      } else reply(event, 'subtitle-stream-reply', new Error('Missing subtitle entry, should request metadata first.'));
    } else reply(event, 'subtitle-stream-reply', new Error('Missing videoPath entry, should request metadata first.'));
  });
  ipcMain.on('subtitle-destroy-request', async (event: Event, videoPath: string, streamIndex: number) => {
    const streamSubtitlesMap = videoSubtitlesMap.get(videoPath);
    if (streamSubtitlesMap) {
      const subtitle = streamSubtitlesMap.get(streamIndex);
      if (subtitle) {
        await splayerxProxy.stopExtractSubtitles();
        lastVideoPath = '';
        lastStreamIndex = -1;
      }
    }
    reply(event, 'subtitle-destroy-reply');
  });
  ipcMain.on('thumbnail-request', (event,
    videoPath, imagePath, interval,
    thumbnailWidth, cols) => {
    if (existsSync(imagePath)) {
      reply(event, 'thumbnail-reply', null, imagePath, videoPath);
    } else if (existsSync(videoPath)) {
      splayerxProxy.generateThumbnails(
        videoPath, imagePath, interval,
        thumbnailWidth.toString(), cols.toString(), '0',
        (err) => {
          if (err === '0' && existsSync(imagePath)) {
            reply(event, 'thumbnail-reply', null, imagePath, videoPath);
          } else {
            if (typeof err !== 'string') err = `${err}, type: ${typeof err}`;
            reply(event, 'thumbnail-reply', `thumbnail-reply: ${err}`);
          }
        },
      );
    } else {
      reply(event, 'thumbnail-reply', 'File does not exist.');
    }
  });
}
