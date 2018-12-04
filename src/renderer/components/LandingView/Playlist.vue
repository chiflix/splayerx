<template>
  <div class="controller"
    :style="{
      bottom : this.windowWidth > 1355 ? `${40 / 1355 * this.windowWidth}px` : '40px',
      transition: tranFlag ? 'left 400ms cubic-bezier(0.42, 0, 0.58, 1)' : '',
    }">
    <div class="playlist no-drag"
      :style="{marginLeft: this.windowWidth > 1355 ? `${50 / 1355 * this.windowWidth}px` : '50px'}">
      <div class="button"
        :style="{
          height:`${thumbnailHeight}px`,
          width:`${thumbnailWidth}px`,
          marginRight: `${marginRight}px`,
        }"
        @click="openOrMove">
        <div class="btnMask">
          <Icon class="addUi" type="add"></Icon>
        </div>
      </div>
      <div class="item"
        v-for="(item, index) in lastPlayedFile"
        :id="'item'+index"
        :key="item.path"
        :class="{ shadow: showShadow, chosen: item.chosen }"
        :style="{
          width: `${thumbnailWidth}px`,
          height: `${thumbnailHeight}px`,
          marginRight: `${marginRight}px`,
          backgroundImage: itemShortcut(item.smallShortCut, item.cover, item.lastPlayedTime, item.duration),
        }">
        <div class="white-hover"
            v-show="item.chosen"/>
        <div class="content"
          @click.stop="onRecentItemClick(item, index)"
          @mouseout="onRecentItemMouseout(index)"
          @mouseover="onRecentItemMouseover(item, index)"
          @mousedown.stop="onRecentItemMousedown($event, index)"
          :style="{
            width: `${thumbnailWidth}px`,
            height: item.chosen ? `${thumbnailHeight + 9}px` : `${thumbnailHeight}px`,
          }">
          <div class="border"
            :style="{
              left: `-${0.7 / 2}px`,
              top: `-${0.7 / 2}px`,
              width: `${thumbnailWidth - 0.7}px`,
              height: `${thumbnailHeight - 0.7}px`,
              border: item.chosen ? '0.7px solid rgba(255,255,255,0.6)' : '0.7px solid rgba(255,255,255,0.15)'              
            }"/>
          <div class="mask">
            <Icon class="deleteUi" type="delete"></Icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import path from 'path';
import Icon from '../BaseIconContainer';
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
      tranFlag: true,
      validHover: true,
    };
  },
  props: {
    lastPlayedFile: {
      type: Object.Array,
      require: true,
      default: () => [],
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
      this.tranFlag = true;
      if (this.showItemNum - this.moveItem <= this.lastPlayedFile.length &&
        !this.isFullScreen && e.keyCode === 39) {
        this.validHover = false;
        this.tranFlag = true;
        const ss = -((this.lastPlayedFile.length + 1) - (this.showItemNum - this.moveItem)) *
          (this.thumbnailWidth + 15);
        this.move += ss;
        this.moveItem = this.showItemNum - this.lastPlayedFile.length - 1;
        lf.style.left = `${this.move}px`;
      } else if (this.moveItem !== 0 && !this.isFullScreen && e.keyCode === 37) {
        this.validHover = false;
        this.tranFlag = true;
        this.moveItem = 0;
        this.move = 0;
        lf.style.left = '';
      }
      this.$bus.$emit('moveItem', this.moveItem);
      this.$bus.$emit('move', this.move);
    };
  },
  computed: {
    thumbnailWidth() {
      let width = 0;
      const A = 50; // playlist left margin
      const B = 15; // space between each playlist item
      const C = 50; // the space between last playlist item and right edge of the screen
      if (this.windowWidth > 512 && this.windowWidth <= 1355) {
        width = ((((this.windowWidth - A) - C) + B) / this.showItemNum) - B;
      } else if (this.windowWidth > 1355) {
        width = this.windowWidth * (112 / 1355);
      }
      return Math.round(width);
    },
    thumbnailHeight() {
      return Math.round((this.thumbnailWidth * 63) / 112);
    },
    marginRight() {
      return this.windowWidth > 1355 ? (this.windowWidth / 1355) * 15 : 15;
    },
  },
  watch: {
    windowWidth() {
      this.tranFlag = false;
    },
    showItemNum(val, oldval) {
      if (val > oldval) {
        if (this.moveItem <= oldval - (1 + this.lastPlayedFile.length) &&
          oldval <= this.lastPlayedFile.length) {
          const averageWidth = ((this.windowWidth - 100) - ((oldval - 1) * 15)) /
            oldval;
          this.move += (averageWidth + this.marginRight) * (val - oldval);
          this.moveItem += val - oldval;
        } else if (val >= this.moveItem + this.lastPlayedFile
          .length + 2) {
          const averageWidth = ((this.windowWidth - 100) - ((val - 1) * 15)) /
            val;
          this.move += (averageWidth + this.marginRight) *
            (val - this.moveItem - this.lastPlayedFile.length - 1);
          this.moveItem += val - this.moveItem - this.lastPlayedFile.length - 1;
        }
        if (val >= 10 || val >= this.lastPlayedFile.length + 1) {
          this.move = 0;
          this.moveItem = 0;
        }
      }
    },
    validHover(val) {
      if (!val) {
        setTimeout(() => {
          this.validHover = true;
        }, 400);
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
      // eslint-disable-next-line
      process.env.NODE_ENV === 'testing' ? '' : dialog.showOpenDialog(focusedWindow, {
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
      }, (items) => {
        self.showingPopupDialog = false;
        if (items) {
          if (!items[0].includes('\\') || process.platform === 'win32') {
            self.openFile(items[0]);
          } else {
            this.addLog('error', `Failed to open file: ${items[0]}`);
          }
          if (items.length > 1) {
            this.$store.commit('PlayingList', items);
          } else {
            const similarVideos = this.findSimilarVideoByVidPath(items[0]);
            this.$store.commit('FolderList', similarVideos);
          }
        }
      });
    },
    openOrMove() {
      const divLeft = document.querySelector('.controller');
      if (this.moveItem === -1) {
        this.tranFlag = true;
        divLeft.style.left = '0px';
        this.move = 0;
        this.moveItem = 0;
        this.$bus.$emit('moveItem', this.moveItem);
        this.$bus.$emit('move', this.move);
      } else if (this.windowWidth > 1355) {
        this.open();
      } else {
        this.open();
      }
    },
    backgroundUrl() {
      switch (this.imageTurn) {
        case 'odd': return this.backgroundUrlOdd;
        case 'even': return this.backgroundUrlEven;
        default: return '';
      }
    },
    itemShortcut(shortCut, cover, lastPlayedTime, duration) {
      return duration - lastPlayedTime < 5 ? `url("${cover}")` : `url("${shortCut}")`;
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
        this.isFullScreen) && this.mouseFlag && this.validHover) {
        this.tranFlag = true;
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
        this.displayInfo.cover = item.cover;
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
        this.validHover = false;
        this.tranFlag = true;
        if (index === this.showItemNum - this.moveItem - 1 && !this.isFullScreen) {
          const ss = -((this.lastPlayedFile.length + 1) - (this.showItemNum - this.moveItem)) *
            (this.thumbnailWidth + 15);
          this.move += ss;
          this.moveItem = this.showItemNum - this.lastPlayedFile.length - 1;
          lf.style.left = `${this.move}px`;
        } else if (index + this.moveItem === -2 && !this.isFullScreen) {
          this.moveItem = 0;
          this.move = 0;
          lf.style.left = '';
        } else {
          this.openFile(item.path);
          const similarVideos = this.findSimilarVideoByVidPath(item.path);
          this.$store.commit('FolderList', similarVideos);
        }
        this.$bus.$emit('moveItem', this.moveItem);
        this.$bus.$emit('move', this.move);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
$border-radius: 2px;
.controller {
  position: absolute;
  left: 0;
  width: auto;
  z-index: 4;

  .playlist {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-end;

    .button {
      background-color: rgba(0, 0, 0, 0.12);
      transition: background-color 150ms ease-out;
      backdrop-filter: blur(9.8px);
      cursor: pointer;
    }

    .button:hover {
      background-color: rgba(123, 123, 123, 0.12);
      transition: background-color 150ms ease-out;
    }

    .btnMask {
      border-radius: 2px;
      width: 100%;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
    }

    .btnMask:hover {
      border: 1px solid rgba(255, 255, 255, 0.6);
    }

    .addUi {
      margin: auto;
    }

    .item {
      transition: transform 100ms ease-in;
      position: relative;
      border-radius: $border-radius;
      cursor: pointer;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center center;
    }

    .mask {
      border-radius: $border-radius;
      display: none;
      width: 100%;
      height: calc(100% - 9px);
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
.content {
  position: absolute;
  top: 0;
  border-radius: $border-radius;
}
.white-hover {
  position: absolute;
  border-radius: $border-radius;
  bottom: 0px;
  width: 100%;
  height: 100%;
  background-color: rgba(255,255,255,0.2);
}
.border {
  position: absolute;
  box-sizing: content-box;
  border-radius: $border-radius;
}
.chosen {
  transform: translateY(-9px);
}
</style>
