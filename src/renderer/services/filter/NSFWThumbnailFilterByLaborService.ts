import { ipcRenderer } from 'electron';
import { IMediaFilter } from '@/interfaces/IMediaFilter';

export default class NSFWFilterByLaborService implements IMediaFilter {
  /**
   * Check if image is not safe for work
   * @param src Source of image
   */
  public async checkImage(src: string) {
    let taskDoneListener: Function | null = null;
    console.time(src);
    try {
      return await Promise.race<Promise<boolean>>([
        new Promise<boolean>((resolve) => {
          const taskType = 'nsfw';
          ipcRenderer.send('labor-task-add', taskType, src, src, { cache: true });
          taskDoneListener = (evt: Electron.Event, type: string, id: string, result: boolean) => {
            if (type === taskType && id === src) resolve(!!result);
          };
          ipcRenderer.on('labor-task-done', taskDoneListener);
        }),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('NSFW labor timeout')), 2000)),
      ]);
    } catch (ex) {
      console.error(ex, src);
      return false;
    } finally {
      console.timeEnd(src);
      if (taskDoneListener) ipcRenderer.removeListener('labor-task-done', taskDoneListener);
    }
  }
}

export const nsfwThumbnailFilterService = new NSFWFilterByLaborService();
