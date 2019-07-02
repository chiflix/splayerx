export type AITaskInfo = {
  mediaHash: string,
  taskId: string,
  estimateTime: number,
}

export interface IMediaStorable {
  /**
   * @description 根据hash、tag，生成对应的图片将要存放的路径
   * @author tanghaixiang
   * @param {string} mediaHash 视频hash码
   * @param {string} tag 图片类别
   * @returns {(Promise<string | null>)} 返回生成对应的路径
   */
  generatePathBy(mediaHash: string, tag: string): Promise<string | null>
  /**
   * @description  根据hash、tag，取得对应的图片路径
   * @author tanghaixiang
   * @param {string} mediaHash 视频hash码
   * @param {string} tag 图片类别
   * @returns {(Promise<string | null>)} 返回文件路径，如果没有就是null
   */
  getImageBy(mediaHash: string, tag: string): Promise<string | null>
  getAsyncTaskInfo(): AITaskInfo | undefined
  setAsyncTaskInfo(taskInfo: AITaskInfo): void
  clearAsyncTaskInfo(): void
}
