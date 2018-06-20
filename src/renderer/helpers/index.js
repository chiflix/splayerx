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
    openFile(path) {
      // this.$storage.set('recent-played', []);
      this.$storage.get('recent-played', (err, data) => {
        console.log(data);
        const newElement = {
          path,
          shortCut: '',
          lastPlayedTime: 0.0,
        };
        if (err) {
          // TODO: proper error handle
          console.error(err);
        } else if (Array.isArray(data)) {
          console.log('its an array!');
          if (data.length < 4) {
            if (this.$_indexOfExistedFileIn(data, path) === -1) {
              data.unshift(newElement);
            } else {
              console.log(2);
              const item = data.splice(this.$_indexOfExistedFileIn(data, path), 1);
              data.unshift(item[0]);
            }
            console.log('changed:');
            console.log(data);
            this.$storage.set('recent-played', data);
          } else {
            if (this.$_indexOfExistedFileIn(data, path) === -1) {
              data.pop();
              data.unshift(newElement);
            } else {
              const item = data.splice(this.$_indexOfExistedFileIn(data, path), 1);
              data.unshift(item[0]);
            }
            console.log('changed:');
            console.log(data);
            this.$storage.set('recent-played', data);
          }
        } else if (Object.keys(data).length === 0 && data.constructor === Object) {
          // if there's no value for key 'recent-played'
          this.$storage.set('recent-played', [newElement]);
        }
      });
      this.$store.commit('SrcOfVideo', path);
      this.$router.push({
        name: 'playing-view',
      });
    },
    $_indexOfExistedFileIn(data, path) {
      for (let i = 0; i < data.length; i += 1) {
        const object = data[i];
        const iterator = Object.keys(object).indexOf('path');
        if (iterator !== -1) {
          if (object.path === path) {
            return i;
          }
        }
      }
      return -1;
    },
  },
};
