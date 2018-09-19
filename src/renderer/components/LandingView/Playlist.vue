<template>
    <div class="controller"
         :style="{bottom : this.windowWidth > 1355 ? `${40 / 1355 * this.windowWidth}px` : '40px'}">
      <div class="playlist"
           :style="{marginLeft: this.windowWidth > 1355 ? `${50 / 1355 * this.windowWidth}px` : '50px'}">
        <div class="button"
             :style="{
             height:`${itemHeight}px`,
             width:`${itemWidth}px`,
             }"
             @click="openOrMove">
          <div class="btnMask"
               :style="{
               height:`${itemHeight}px`,
               width:`${itemWidth}px`,
               }">
            <Icon class="addUi" type="add"></Icon>
          </div>
        </div>
        <div class="item"
             v-for="(item, index) in lastPlayedFile"
             :id="'item'+index"
             :key="item.path"
             :class="showShadow ? 'shadow' : '' "
             :style="{
             backgroundImage: itemShortcut(item.shortCut),
             width: item.chosen ? `${itemWidth * 9 / 7}px` : `${itemWidth}px`,
             height: item.chosen ? `${itemHeight * 9 / 7}px` : `${itemHeight}px`,
             }"
             @click.stop="onRecentItemClick(item, index)"
             @mouseover="onRecentItemMouseover(item, index)"
             @mouseout="onRecentItemMouseout(index)"
             @mousedown.stop="onRecentItemMousedown($event, index)">
          <div class="mask"
               :style="{
               width: item.chosen ? `${itemWidth * 9 / 7}px` : `${itemWidth}px`,
               height: item.chosen ? `${itemHeight * 9 / 7}px` : `${itemHeight}px`,
               }">
            <Icon class="deleteUi" type="delete"></Icon>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import path from 'path';
import Icon from '../IconContainer';
export default {
  name: 'playlist',
  components: { Icon },
  data() {
    return {
      imageTurn: '',
      isTurnToOdd: false,
      backgroundUrlOdd: '',
      backgroundUrlEven: '',
      showShortcutImage: false,
      langdingLogoAppear: true,
      displayInfo: [],
      mouseDown: false,
      isDragging: false,
      disX: '',
      disY: '',
      recentFileDel: false,
      showingPopupDialog: false,
      move: 0,
      moveItem: 0,
      mouseFlag: true,
      showShadow: true,
      itemWidth: 112,
      itemHeight: 65,
    };
  },
  props: {
    lastPlayedFile: {
      type: Object.Array,
      require: true,
      default: [],
    },
    changeSize: {
      type: Number,
      require: true,
    },
    showItemNum: {
      type: Number,
      require: true,
    },
    isFullScreen: {
      type: Boolean,
      require: true,
    },
    windowWidth: {
      type: Number,
      require: true,
    },
  },
  destroyed() {
    document.onmousemove = null;
    document.onmouseup = null;
    window.onkeyup = null;
  },
  mounted() {
    const lf = document.querySelector('.controller');
    window.onkeyup = (e) => {
      if (this.showItemNum - this.moveItem <= this.lastPlayedFile.length &&
        !this.isFullScreen && e.keyCode === 39) {
        this.moveItem -= 1;
        const ss = (this.move - 15) - (this.changeSize * (this.windowWidth / 100));
        this.move = ss;
        lf.style.left = `${ss}px`;
      } else if (this.moveItem === -1 && !this.isFullScreen && e.keyCode === 37) {
        this.move = 0;
        this.moveItem = 0;
        lf.style.left = '0px';
      } else if (this.moveItem !== 0 && !this.isFullScreen && e.keyCode === 37) {
        this.moveItem += 1;
        const ss = (this.move + 15) + (this.changeSize * (this.windowWidth / 100));
        this.move = ss;
        lf.style.left = `${ss}px`;
      }
      this.$bus.$emit('moveItem', this.moveItem);
      this.$bus.$emit('move', this.move);
    };
  },

  watch: {
    windowWidth(val) {
      this.itemWidth = (this.changeSize * val) / 100;
      this.itemHeight = (this.changeSize * val * 405) / 100 / 720;
      document.querySelector('.item').style.transition = '';
    },
    showItemNum(val, oldval) {
      if (val > oldval) {
        if (this.moveItem <= oldval - (1 + this.lastPlayedFile.length) &&
          oldval <= this.lastPlayedFile.length) {
          const averageWidth = ((this.windowWidth - 100) - ((oldval - 1) * 15)) /
            oldval;
          this.move += (averageWidth + 15) * (val - oldval);
          this.moveItem += val - oldval;
        } else if (val >= this.moveItem + this.lastPlayedFile
          .length + 2) {
          const averageWidth = ((this.windowWidth - 100) - ((val - 1) * 15)) /
            val;
          this.move += (averageWidth + 15) *
            (val - this.moveItem - this.lastPlayedFile.length - 1);
          this.moveItem += val - this.moveItem - this.lastPlayedFile.length - 1;
        }
        if (val >= 10 || val >= this.lastPlayedFile.length + 1) {
          this.move = 0;
          this.moveItem = 0;
        }
      }
    },
  },
  methods: {
    open(link) {
      if (this.showingPopupDialog) {
        // skip if there is already a popup dialog
        return;
      }
      const self = this;
      const { remote } = this.$electron;
      const { dialog } = remote;
      const browserWindow = remote.BrowserWindow;
      const focusedWindow = browserWindow.getFocusedWindow();
      const VALID_EXTENSION = ['3g2', '3gp', '3gp2', '3gpp', 'amv', 'asf', 'avi', 'bik', 'bin', 'crf', 'divx', 'drc', 'dv', 'dvr-ms', 'evo', 'f4v', 'flv', 'gvi', 'gxf', 'iso', 'm1v', 'm2v', 'm2t', 'm2ts', 'm4v', 'mkv', 'mov', 'mp2', 'mp2v', 'mp4', 'mp4v', 'mpe', 'mpeg', 'mpeg1', 'mpeg2', 'mpeg4', 'mpg', 'mpv2', 'mts', 'mtv', 'mxf', 'mxg', 'nsv', 'nuv', 'ogg', 'ogm', 'ogv', 'ogx', 'ps', 'rec', 'rm', 'rmvb', 'rpl', 'thp', 'tod', 'tp', 'ts', 'tts', 'txd', 'vob', 'vro', 'webm', 'wm', 'wmv', 'wtv', 'xesc'];

      self.showingPopupDialog = true;
      // TODO: move openFile method to a single location
      dialog.showOpenDialog(focusedWindow, {
        title: 'Open Dialog',
        defaultPath: link,
        filters: [{
          name: 'Video Files',
          extensions: VALID_EXTENSION,
        }, {
          name: 'All Files',
          extensions: ['*'],
        }],
        properties: ['openFile'],
      }, (item) => {
        self.showingPopupDialog = false;
        if (item) {
          self.openFile(item[0]);
        }
      });
    },
    openOrMove() {
      const divLeft = document.querySelector('.controller');
      if (this.moveItem === -1) {
        divLeft.style.left = '0px';
        this.move = 0;
        this.moveItem = 0;
        this.$bus.$emit('moveItem', this.moveItem);
        this.$bus.$emit('move', this.move);
      } else if (this.windowWidth > 1355) {
        this.open('./');
      } else {
        this.open('./');
      }
    },
    backgroundUrl() {
      switch (this.imageTurn) {
        case 'odd': return this.backgroundUrlOdd;
        case 'even': return this.backgroundUrlEven;
        default: return '';
      }
    },
    itemShortcut(shortCut) {
      return `url("${shortCut}")`;
    },
    itemInfo() {
      return {
        baseName: path.basename(this.item.path, path.extname(this.item.path)),
        lastTime: this.item.lastPlayedTime,
        duration: this.item.duration,
        percentage: (this.item.lastPlayedTime / this.item.duration) * 100,
      };
    },
    onRecentItemMouseover(item, index) {
      if (((index !== this.showItemNum - this.moveItem - 1 && index + this.moveItem !== -2) ||
        this.isFullScreen) && this.mouseFlag) {
        document.querySelector(`#item${index}`).style.transition = 'width 150ms ease-out, height 150ms ease-out, border 150ms ease-out';
        this.item = item;
        this.$set(this.lastPlayedFile[index], 'chosen', true);
        if (item.shortCut !== '') {
          this.isChanging = true;
          this.isTurnToOdd = !this.isTurnToOdd;
          if (this.isTurnToOdd) {
            this.imageTurn = 'odd';
            this.backgroundUrlOdd = item.shortCut;
          } else {
            this.imageTurn = 'even';
            this.backgroundUrlEven = item.shortCut;
          }
          this.langdingLogoAppear = false;
          this.showShortcutImage = true;
        } else {
          this.langdingLogoAppear = true;
          this.showShortcutImage = false;
        }
        this.displayInfo.langdingLogoAppear = this.langdingLogoAppear;
        this.displayInfo.showShortcutImage = this.showShortcutImage;
        this.displayInfo.imageTurn = this.imageTurn;
        this.displayInfo.backgroundUrl = this.backgroundUrl();
        this.displayInfo.baseName = this.itemInfo().baseName;
        this.displayInfo.lastTime = this.itemInfo().lastTime;
        this.displayInfo.duration = this.itemInfo().duration;
        this.displayInfo.percentage = this.itemInfo().percentage;
        this.$bus.$emit('displayInfo', this.displayInfo);
      }
    },
    onRecentItemMouseout(index) {
      if (this.mouseFlag) {
        this.$set(this.lastPlayedFile[index], 'chosen', false);
      }
    },
    onRecentItemMousedown(ev, index) {
      const vm = this;
      this.disX = ev.clientX;
      this.disY = ev.clientY;
      const item = document.querySelector(`#item${index}`);
      function mousemove(ev) {
        if (vm.mouseDown) {
          vm.isDragging = true;
          const l = ev.clientX - vm.disX;
          const t = ev.clientY - vm.disY;
          item.style.left = `${l}px`;
          item.style.top = `${t}px`;
          const limitWidth = (vm.changeSize / 100) *
            vm.windowWidth;
          const limitHeight = (vm.changeSize / 100) *
            document.body.clientHeight;
          const itemMask = document.querySelector(`#item${index} .mask`);
          const itemDelete = document.querySelector(`#item${index} .deleteUi`);
          if (l <= -limitWidth || l >= limitWidth || t >= limitHeight || t <= -limitHeight) {
            itemMask.style.display = 'flex';
            if (itemMask && itemDelete) {
              setTimeout(() => {
                itemMask.style.backgroundColor = 'rgba(0, 0, 0, 0.43)';
                itemDelete.style.display = 'inline';
              }, 150);
            }
            vm.recentFileDel = true;
          } else {
            itemMask.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            itemMask.style.display = 'none';
            itemDelete.style.display = 'none';
            vm.recentFileDel = false;
          }
        }
      }
      function mouseup() {
        vm.mouseFlag = true;
        vm.mouseDown = false;
        if (vm.recentFileDel) {
          vm.displayInfo.langdingLogoAppear = true;
          vm.displayInfo.showShortcutImage = false;
          vm.$bus.$emit('displayInfo', vm.displayInfo);
          const deletData = vm.lastPlayedFile.splice(index, 1);
          vm.infoDB().delete('recent-played', deletData[0].quickHash);
          vm.recentFileDel = false;
        } else {
          this.showShadow = true;
          item.style.zIndex = '';
          item.style.left = '';
          item.style.top = '';
        }
      }
      this.isDragging = false;
      if (index !== this.showItemNum - this.moveItem - 1 && index + this.moveItem !== -2) {
        this.mouseFlag = false;
        this.mouseDown = true;
        document.onmousemove = mousemove;
        document.onmouseup = mouseup;
        document.querySelector('.controller').parentNode.onmouseup = mouseup;
        this.showShadow = false;
        item.style.zIndex = 5;
      }
    },
    onRecentItemClick(item, index) {
      const lf = document.querySelector('.controller');
      if (!this.isDragging) {
        if (index === this.showItemNum - this.moveItem - 1 && !this.isFullScreen) {
          this.moveItem -= 1;
          const ss = (this.move - 15) - (this.changeSize * (this.windowWidth / 100));
          this.move = ss;
          lf.style.left = `${ss}px`;
        } else if (index + this.moveItem === -2 && !this.isFullScreen) {
          this.moveItem += 1;
          const ss = (this.move + 15) + (this.changeSize * (this.windowWidth / 100));
          this.move = ss;
          lf.style.left = `${ss}px`;
        } else {
          this.openFile(item.path);
        }
        this.$bus.$emit('moveItem', this.moveItem);
        this.$bus.$emit('move', this.move);
      }
    },
  },
};
</script>

<style lang="scss">
    .controller {
        position: absolute;
        left: 0;
        width: auto;
        z-index: 4;
        transition : left 100ms linear;

        .playlist {
            -webkit-app-region: no-drag;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: flex-end;

            .button {
                background-color: rgba(0, 0, 0, 0.12);
                transition: background-color 150ms ease-out;
                backdrop-filter: blur(9.8px);
                margin-right: 15px;
                cursor: pointer;
            }

            .button:hover {
                background-color: rgba(123, 123, 123, 0.12);
                transition: background-color 150ms ease-out;
            }

            .btnMask {
                border-radius: 2px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
            }

            .addUi {
                margin: auto;
            }

            .item {
                position: relative;
                color: #e4e4c4;
                border-radius: 2px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                min-height: 63px;
                min-width: 112px;
                color: gray;
                cursor: pointer;
                margin-right: 15px;
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center center;
                display: flex;
                box-shadow: 0 20px 29px rgba(0, 0, 0, 0.3);
            }

            .mask {
                border-radius: 2px;
                display: none;
                box-shadow: 0 26px 39px rgba(0, 0, 0, 0.3), 0 5px 20px rgba(0, 0, 0, 0.14);
                transition: background-color 150ms;
            }

            .deleteUi {
                margin: auto;
                display: none;
            }
            .shadow {
                position: relative;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.1) inset;
            }
            .shadow:before, .shadow:after {
                content: "";
                position: absolute;
                z-index: -1;
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                top: 50%;
                bottom: 0;
                left: 10px;
                right: 10px;
                border-radius: 50px;
            }
            .shadow:after {
                right: 10px;
                left: auto;
                transform: skew(8deg) rotate(3deg);
            }
        }
    }
</style>
