export interface ICacheFileStorable {
 /** 
   * @description 公开API 根据mediaHash得到该视频的缓存目录
   * @author tanghaixiang
   * @param {string} mediaHash 视频hash码
   * @returns {string} 返回改视频对应的缓存路径
   */
  getPathBy(mediaHash: string): string
  /**
   * @description 根据mediaHash读取该视频目录下的文件列表
   * @author tanghaixiang
   * @param {string} mediaHash 视频hash码
   * @returns {(Promise<string[] | null>)} 返回当前目录下的文件列表
   */
  readDirBy(mediaHash: string): Promise<string[] | null>
  /**
   * @description 根据mediaHash创建对应的目录
   * @author tanghaixiang
   * @param {string} mediaHash 视频hash码
   * @returns {(Promise<string[] | null>)} 返回是否成果创建
   */
  createDirBy(mediaHash: string): Promise<boolean>
  /**
   * @description 根据mediaHash删除对应的目录
   * @author tanghaixiang
   * @param {string} mediaHash 视频hash码
   * @returns {Promise<boolean>} 返回是否成果删除
   */
  removeDirBy(mediaHash: string): Promise<boolean>
  /**
   * @description 写入文件到对应的地址
   * @author tanghaixiang
   * @param {string} path 路径
   * @param {Buffer} content 文件内容
   * @returns {Promise<boolean>} 返回是否写入
   */
  writeFile(path: string, content: Buffer): Promise<boolean>
  /**
   * @description 读取对应地址的文件
   * @author tanghaixiang
   * @param {string} path 文件路径
   * @returns {(Promise<Buffer | null>)} 返回文件内容
   */
  readFile(path: string): Promise<Buffer | null>
  /**
   * @description 删除对应地址的文件
   * @author tanghaixiang
   * @param {string} path 文件路径
   * @returns {Promise<boolean>} 返回文件是否被删除
   */
  removeFile(path: string): Promise<boolean>
}
