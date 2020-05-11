import { isVideo, isAudio } from '../../shared/utils';


/**
 * 从命令行参数里过滤出视频文件
 *
 * @export
 * @param {*} argv
 * @returns 数组
 */
export function getOpenedFiles(argv) {
  let args = [...argv];
  args = args.slice(process.isPackaged ? 2 : 1);
  const videos = args.filter(arg => isVideo(arg) || isAudio(arg));
  return videos;
}

export default {
  getOpenedFiles,
};
