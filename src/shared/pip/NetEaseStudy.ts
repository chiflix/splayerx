export default class NetEaseStudy {
  public adapter: string;

  public watcher: string;

  public recover: string;

  public constructor() {
    this.adapter = 'var player = document.querySelector(".ux-video-player");'
      + 'player.style.position = "fixed";'
      + 'player.style.width = "100%";'
      + 'player.style.height = "100%";'
      + 'player.style.left = "0";'
      + 'player.style.top = "0";'
      + 'var course = document.querySelector("#course-learn-box");'
      + 'if (course) course.style.zIndex = "999999";'
      + 'var lesson = document.querySelector("#lesson-learn-box");'
      + 'if (lesson) lesson.style.zIndex = "999999";'
      + 'player.style.zIndex = "999999";'
      + 'document.body.style.overflow = "hidden";';
    this.watcher = '';
    this.recover = 'var player = document.querySelector(".ux-video-player");'
      + 'player.style.position = "";'
      + 'player.style.width = "";'
      + 'player.style.height = "";'
      + 'player.style.left = "";'
      + 'player.style.top = "";'
      + 'var course = document.querySelector("#course-learn-box");'
      + 'if (course) course.style.zIndex = "";'
      + 'var lesson = document.querySelector("#lesson-learn-box");'
      + 'if (lesson) lesson.style.zIndex = "";'
      + 'player.style.zIndex = "";'
      + 'document.body.style.overflow = "";';
  }
}
