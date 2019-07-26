/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-07-23 17:31:21
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-07-26 15:15:45
 */

import AudioTranslateService from '@/services/media/AudioTranslateService';

describe('AudioTranslateService', () => {
  const audioTranslateService = new AudioTranslateService();
  it('should not receive data after audio translate remove listeners ', () => {
    let taskInfo = {
      mediaHash: '',
      taskId: '111',
    };
    const grab = audioTranslateService.startJob({
      audioId: '1',
      mediaHash: 'abcd-efgh',
      videoSrc: '/a/1.mp4',
      audioLanguageCode: 'en',
      targetLanguageCode: 'en',
    });
    expect(grab.mediaHash).to.equal('abcd-efgh');
    expect(grab.audioId).to.equal(0);
    expect(grab.audioLanguageCode).to.equal('en');
    expect(grab.targetLanguageCode).to.equal('en');
    expect(grab.videoSrc).to.equal('/a/1.mp4');
    grab.on('task', (task) => {
      taskInfo = task;
    });
    audioTranslateService.stop();
    audioTranslateService.emit('task', {
      mediaHash: '',
      taskId: '999',
      estimateTime: 10,
      audioLanguageCode: '',
      targetLanguage: '',
    });
    expect(taskInfo.taskId).to.equal('111');
  });
});
