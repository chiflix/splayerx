export interface ICacheFileStorable {
 /** 
   * @description 公开API 根据mediaHash得到该视频的缓存目录
   * @author tanghaixiang@xindong.com
   * @date 2019-05-22
   * @param {string} mediaHash
   * @returns {string} 返回改视频对应的缓存路径
   * @memberof CacheFile
   */
  getPathBy(mediaHash: string): string
  /**
   * @description 根据mediaHash读取该视频目录下的文件列表
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} mediaHash
   * @returns {(Promise<string[] | null>)} 返回当前目录下的文件列表
   * @memberof ICacheFileStorable
   */
  readDirBy(mediaHash: string): Promise<string[] | null>
  /**
   * @description 根据mediaHash创建对应的目录
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} mediaHash
   * @returns {(Promise<string[] | null>)} 返回是否成果创建
   * @memberof ICacheFileStorable
   */
  createDirBy(mediaHash: string): Promise<boolean>
  /**
   * @description 根据mediaHash删除对应的目录
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} mediaHash
   * @returns {Promise<boolean>} 返回是否成果删除
   * @memberof ICacheFileStorable
   */
  removeDirBy(mediaHash: string): Promise<boolean>
  /**
   * @description 写入文件到对应的地址
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} path
   * @param {Buffer} content
   * @returns {Promise<boolean>} 返回是否写入
   * @memberof ICacheFileStorable
   */
  writeFile(path: string, content: Buffer): Promise<boolean>
  /**
   * @description 读取对应地址的文件
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} path
   * @returns {(Promise<Buffer | null>)} 返回文件内容
   * @memberof ICacheFileStorable
   */
  readFile(path: string): Promise<Buffer | null>
  /**
   * @description 删除对应地址的文件
   * @author tanghaixiang@xindong.com
   * @date 2019-06-11
   * @param {string} path
   * @returns {Promise<boolean>} 返回文件是否被删除
   * @memberof ICacheFileStorable
   */
  removeFile(path: string): Promise<boolean>
}
