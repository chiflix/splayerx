import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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
        return `${hours}:${minutes}:${seconds}`;
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

    mediaQuickHash(file) {
      function md5Hex(text) {
        return crypto.createHash('md5').update(text).digest('hex');
      }

      fs.readFile(path.join(__dirname, file), (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const offset = [
          4096,
          Math.floor(data.length / 3),
          Math.floor(data.length / 3) * 2,
          data.length - 8192,
        ];
        const tmpRes = [];
        for (let i = 0; i < 4; i += 1) {
          const tmp = data.slice(offset[i], offset[i] + 4096);
          tmpRes[i] = md5Hex(tmp);
        }
        // console.log(tmpRes.join('-'));
        return tmpRes.join('-');
      });
    },


  },
};
