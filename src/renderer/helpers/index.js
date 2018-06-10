import path from 'path';
import fs from 'fs';

export default {
  methods: {
    timecodeFromSeconds(s) {
      const dt = new Date(Math.abs(s) * 1000);
      let hours = dt.getUTCHours();
      let minutes = dt.getUTCMinutes();
      let seconds = dt.getUTCSeconds();

      // the above dt.get...() functions return a single digit
      // so I prepend the zero here when needed
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      if (seconds < 10) {
        seconds = `0${seconds}`;
      }
      if (hours > 0) {
        if (hours < 10) {
          hours = `${hours}`;
        }
        if (s < 0) {
          return `-${hours}:${minutes}:${seconds}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      if (s < 0) {
        return `-${minutes}:${seconds}`;
      }
      return `${minutes}:${seconds}`;
    },
    findSubtitleFilesByVidPath(vidPath, callback) {
      vidPath = vidPath.replace(/^file:\/\//, '');
      const baseName = path.basename(vidPath, path.extname(vidPath));
      const dirPath = path.dirname(vidPath);
      const filter = /\.(srt|vtt)$/;

      if (!fs.existsSync(dirPath)) {
        console.log(`no dir ${dirPath}`);
        return;
      }

      const files = fs.readdirSync(dirPath);
      for (let i = 0; i < files.length; i += 1) {
        const filename = path.join(dirPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (!stat.isDirectory()) {
          if (files[i].startsWith(baseName) && filter.test(files[i])) {
            console.log(`found subtitle file: ${files[i]}`);
            callback(filename);
          }
        }
      }
    },
  },
};
