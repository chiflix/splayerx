// @ts-ignore
import { ipcRenderer } from 'electron';
import { nsfwThumbnailFilterService } from '@/services/filter/NSFWThumbnailFilterService';
import { log } from '@/libs/Log';

interface ILabor<TArgs, TResult> {
  type: string,
  doWork: (args: TArgs) => Promise<TResult>;
}

class NSFWLabor implements ILabor<string, boolean> {
  public get type() { return 'nsfw'; }

  public async doWork(src: string) {
    return nsfwThumbnailFilterService.checkImage(src);
  }
}

class NSFWWarmupLabor implements ILabor<void, void> {
  public get type() { return 'nsfw-warmup'; }

  public async doWork() {
    nsfwThumbnailFilterService.warmup();
  }
}

const labors: ILabor<any, any>[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
  new NSFWWarmupLabor(),
  new NSFWLabor(),
];
function pickLabor(type: string) {
  return labors.find(l => l.type === type);
}

const caches = new Map();
function waitForTasks() {
  ipcRenderer.on('labor-task-add', async (
    evt: Electron.Event,
    type: string,
    id: string,
    args?: Json,
    options?: { cache?: boolean },
  ) => {
    log.debug('task received:', type, id, args, options);
    function notifyTaskDone(result: Json) {
      ipcRenderer.send('labor-task-done', type, id, result);
    }
    const labor = pickLabor(type);
    if (!labor) throw new Error(`Unknown labor type: ${type}`);

    options = Object.assign({ cache: false }, options);
    const taskKey = `${type}$$${id}`;
    if (options.cache) {
      if (!caches[taskKey]) caches[taskKey] = await labor.doWork(args);
      notifyTaskDone(caches[taskKey]);
      return;
    }
    const result = await labor.doWork(args);
    notifyTaskDone(result);
  });
}
waitForTasks();
