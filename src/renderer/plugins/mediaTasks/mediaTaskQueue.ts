import EventEmitter from 'eventemitter3';

export interface MediaTask {
  getId(): string;
  execute(): Promise<any>;
}
type TaskInfo = {
  status: MediaTaskStatus;
  result: any;
  task: MediaTask;
  piority: number;
}
enum MediaTaskStatus {
  ADDED,
  EXECUTING,
  EXECUTED,
  FAILED,
}
export class BaseMediaTaskQueue extends EventEmitter {
  private taskInfos: Map<string, TaskInfo> = new Map();

  private startProcessTasks = false;

  public addTask(task: MediaTask) {
    const id = task.getId();
    if (!this.taskInfos.has(id)) {
      this.taskInfos.set(id, {
        status: MediaTaskStatus.ADDED,
        result: undefined,
        task,
        piority: 0,
      });
    }
    const { status, result } = this.taskInfos.get(id) as TaskInfo;
    return new Promise((resolve, reject) => {
      switch (status) {
        case MediaTaskStatus.ADDED:
        case MediaTaskStatus.EXECUTING:
          this.once(id, ({ result, status }) => {
            this.taskInfos.set(id, {
              status: MediaTaskStatus.EXECUTED,
              result,
              task,
              piority: 0,
            });
            if (status === MediaTaskStatus.EXECUTED) resolve(result);
            else reject(result);
          });
          break;
        case MediaTaskStatus.EXECUTED:
          resolve(result);
          break;
        case MediaTaskStatus.FAILED:
          reject(reject);
          break;
        default:
          break;
      }
      this.processTasks();
    });
  }

  private async* getNextTask() {
    let unExecutedTasks: [string, TaskInfo][] = [];
    // eslint-disable-next-line
    while (
      (unExecutedTasks = Array.from(this.taskInfos.entries())
        .filter(entry => entry[1].status === MediaTaskStatus.ADDED))
        .length
    ) {
      const [id, taskInfo] = unExecutedTasks
        .sort((task1, task2) => task1[1].piority - task2[1].piority)[0];
      try {
        yield {
          id,
          result: await taskInfo.task.execute(),
          status: MediaTaskStatus.EXECUTED,
        };
      } catch (err) {
        yield {
          id,
          result: err,
          status: MediaTaskStatus.FAILED,
        };
      }
    }
  }

  private async processTasks() {
    if (!this.startProcessTasks) {
      this.startProcessTasks = true;
      for await (const taskInfo of this.getNextTask()) {
        if (taskInfo) {
          const { id, result, status } = taskInfo;
          this.emit(id, { result, status });
        }
      }
      this.startProcessTasks = false;
    }
  }
}
