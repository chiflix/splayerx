export interface IStorage {
  /**
   * @description 通过key获取存储的JSON数据
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {String} key
   * @param {*} json
   * @returns {Promise<boolean>} 放回存储的JSON数据
   * @memberof IStorage
   */
  get(key: String, json: any): Promise<boolean>
  /**
   * @description 通过key设置对应的JSON数据
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {String} key
   * @param {*} json
   * @returns {Promise<boolean>} 返回是否成功设置
   * @memberof IStorage
   */
  set(key: String, json: any): Promise<boolean>
  /**
   * @description 清楚JSON存储目录下的所有数据
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @returns {Promise<boolean>}
   * @memberof IStorage
   */
  clear():Promise<boolean>
}
