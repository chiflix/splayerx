export interface IStorage {
  /**
   * @description 通过key获取存储的JSON数据
   * @author tanghaixiang
   * @param {String} key 保存数据对应的key
   * @returns {Promise<unknown>} 返回存储的JSON数据
   */
  get(key: string): Promise<unknown>,
  /**
   * @description 通过key设置对应的JSON数据
   * @author tanghaixiang
   * @param {String} key 保存数据对应的key
   * @param {*} json 保存数据
   * @returns {Promise<boolean>} 返回是否成功设置
   */
  set(key: string, json: Record<string, unknown>): Promise<boolean>,
  /**
   * @description 清楚JSON存储目录下的所有数据
   * @author tanghaixiang
   * @returns {Promise<any>}
   */
  clear(): Promise<unknown[]>,
}
