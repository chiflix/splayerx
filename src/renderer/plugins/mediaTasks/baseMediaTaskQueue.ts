import { log } from '@/libs/Log';

export interface IMediaTask<ResultType, CancelType = void> {
  getId(): string;
  execute(): ResultType | Promise<ResultType>;
  cancel?: () => (CancelType | Promise<CancelType>);
}
type TaskInfo = {
  id: string;
  run: () => Promise<void>;
  cancel: () => Promise<void>;
  piority: number;
  needCancel: boolean;
}
interface IAddTaskOptions {
  piority?: number;
  /** whether or not to cache resolved results */
  cache?: boolean;
  /** in milliseconds */
  timeout?: number;
}
const defaultOptions: IAddTaskOptions = {
  piority: 0,
  cache: false,
  timeout: 600000,
};
export default class BaseMediaTaskQueue {
  private executing = false;

  private cachedResults: Record<string, unknown> = {};

  protected pendingTasks: TaskInfo[] = [];

  public addTask<T>(task: IMediaTask<T>, options: IAddTaskOptions = defaultOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = task.getId();
      const { piority, cache, timeout } = options;
      if (cache && this.cachedResults[id]) {
        resolve(this.cachedResults[id] as T);
        return;
      }
      const run = async (): Promise<void> => {
        try {
          const result = await Promise.race([
            new Promise((resolve, reject) => setTimeout(
              () => reject(new Error(`Timeout: ${task.constructor.name}`)),
              timeout || defaultOptions.timeout,
            )),
            task.execute(),
          ]);
          if (cache) this.cachedResults[id] = result;
          resolve(result as T);
        } catch (error) {
          reject(error);
        } finally {
          this.executing = false;
          this.processTasks();
        }
      };
      const cancel = async (): Promise<void> => {
        try {
          const result = task.cancel ? await Promise.race([
            new Promise((resolve, reject) => setTimeout(
              () => reject(new Error(`Timeout: ${task.constructor.name}`)),
              timeout || defaultOptions.timeout,
            )),
            task.cancel(),
          ]) : () => {};
          resolve(result as T);
        } catch (error) {
          reject(error);
        } finally {
          this.executing = false;
          this.processTasks();
        }
      };
      this.enqueue(run, cancel, id, piority || 0);
      if (!this.executing) this.processTasks();
    });
  }

  public cancelTask(id: string) {
    const taskIndex = this.pendingTasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      const task = this.pendingTasks.splice(taskIndex, 1)[0];
      task.needCancel = true;
      this.pendingTasks.unshift(task);
    }
  }

  private enqueue(
    run: () => Promise<void>, cancel: () => Promise<void>,
    id: string, piority: number,
  ) {
    if (!this.pendingTasks.length
      || this.pendingTasks[this.pendingTasks.length - 1].piority >= piority) {
      this.pendingTasks.push({
        id,
        run,
        cancel,
        piority,
        needCancel: false,
      });
    } else {
      const index = this.pendingTasks.findIndex(task => task.piority < piority);
      this.pendingTasks.splice(index, 0, {
        id,
        run,
        cancel,
        piority,
        needCancel: false,
      });
    }
  }

  private async processTasks() {
    if (!this.pendingTasks.length) return;
    const task = this.pendingTasks.shift();
    if (task) {
      this.executing = true;
      try {
        if (task.needCancel) task.cancel();
        else task.run();
      } catch (ex) {
        log.error('BaseMediaTask', ex);
      }
    } else {
      this.processTasks();
    }
  }
}
