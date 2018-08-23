<template>
    <div class="controller">
        <div class="playlist">
            <div class="button"
                 :style="{
                 height:`${changeSize}vh`,
                 width:`${changeSize}vw`,
            }"
                 @click="openOrMove">
                <div class="btnMask"
                     :style="{
                 height:`${changeSize}vh`,
                 width:`${changeSize}vw`,
                 }">
                    <img class="addUi" src="~@/assets/icon-add.svg" type="image/svg+xml" style="-webkit-user-drag: none;">
                </div>
            </div>
            <div class="item shadow"
                 v-for="(item, index) in lastPlayedFile"
                 :id="'item'+index"
                 :key="item.path"
                 :style="{
              backgroundImage: itemShortcut(item.shortCut),
              width: item.chosen ? `${changeSize * 9 / 7}vw` : `${changeSize}vw`,
              height: item.chosen ? `${changeSize * 9 / 7}vh` : `${changeSize}vh`,
            }"
                 @click="onRecentItemClick(item, index)"
                 @mouseover="onRecentItemMouseover(item, index)"
                 @mouseout="onRecentItemMouseout(index)"
                 @mousedown.stop="onRecentItemMousedown($event, index)">
                <div class="mask"
                     :style="{
                     width: item.chosen ? `${changeSize * 9 / 7}vw` : `${changeSize}vw`,
                     height: item.chosen ? `${changeSize * 9 / 7}vh` : `${changeSize}vh`,
              }">
                    <img class="deleteUi" src="~@/assets/icon-delete.svg" type="image/svg+xml">
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import path from 'path';
export default {
  name: 'playlist',
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
      moveLength: 0,
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
    isFull: {
      type: Boolean,
      require: true,
    },
  },
  mounted() {
  },
  computed: {
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
      const VALID_EXTENSION = [];

      self.showingPopupDialog = true;
      dialog.showOpenDialog(focusedWindow, {
        title: 'Open Dialog',
        defaultPath: link,
        filters: [{
          name: 'Video Files',
          extensions: VALID_EXTENSION,
        }],
        properties: ['openFile'],
      }, (item) => {
        self.showingPopupDialog = false;
        if (item) {
          self.openFile(`file:///${item[0]}`);
        }
      });
    },
    openOrMove() {
      const divLeft = document.querySelector('.controller');
      if (this.moveItem === -1) {
        divLeft.style.transition = 'left 150ms linear';
        divLeft.style.left = '0px';
        this.move = 0;
        this.moveItem = 0;
        this.$bus.$emit('ifMargin', false);
        this.$bus.$emit('moveItem', this.moveItem);
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
      if ((index !== this.showItemNum - this.moveItem - 1 && index + this.moveItem !== -2) ||
        this.isFull) {
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
      this.$set(this.lastPlayedFile[index], 'chosen', false);
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
            vm.$electron.remote.getCurrentWindow().getSize()[0];
          const limitHeight = (vm.changeSize / 100) *
            vm.$electron.remote.getCurrentWindow().getSize()[1];
          if (l <= -limitWidth || l >= limitWidth || t >= limitHeight || t <= -limitHeight) {
            document.querySelector(`#item${index} .mask`).style.display = 'flex';
            setTimeout(() => {
              document.querySelector(`#item${index} .mask`).style.backgroundColor = 'rgba(0, 0, 0, 0.43)';
              document.querySelector(`#item${index} .deleteUi`).style.display = 'inline';
            }, 150);
            vm.recentFileDel = true;
          } else {
            item.style.border = '';
            item.style.boxShadow = '';
            document.querySelector(`#item${index} .mask`).style.backgroundColor = '';
            document.querySelector(`#item${index} .deleteUi`).style.display = 'none';
            document.querySelector(`#item${index} .mask`).style.display = 'none';
            vm.recentFileDel = false;
          }
        }
      }
      function mouseup() {
        vm.mouseDown = false;
        if (vm.recentFileDel) {
          vm.displayInfo.langdingLogoAppear = true;
          vm.displayInfo.showShortcutImage = false;
          vm.$bus.$emit('displayInfo', vm.displayInfo);
          const deletData = vm.lastPlayedFile.splice(index, 1);
          vm.infoDB().delete('recent-played', deletData[0].quickHash);
          vm.recentFileDel = false;
        } else {
          item.style.zIndex = 4;
          item.style.left = '';
          item.style.top = '';
        }
      }
      this.isDragging = false;
      if (index !== this.showItemNum - this.moveItem - 1 && index + this.moveItem !== -2) {
        this.mouseDown = true;
        item.style.zIndex = 5;
        document.onmousemove = mousemove;
        document.querySelector('main').onmouseup = mouseup;
        document.onmouseup = mouseup;
      }
    },
    onRecentItemClick(item, index) {
      const lf = document.querySelector('.controller');
      if (!this.isDragging) {
        if (index === this.showItemNum - this.moveItem - 1 && !this.isFull) {
          this.moveItem -= 1;
          this.moveLength = 15 + (this.changeSize * (document.body.clientWidth / 100));
          const ss = this.move - this.moveLength;
          this.move = ss;
          lf.style.transition = 'left 150ms linear';
          lf.style.left = `${ss}px`;
          this.$bus.$emit('ifMargin', true);
        } else if (index + this.moveItem === -2 && !this.isFull) {
          this.moveItem += 1;
          const ss = (this.move + 15) + (this.changeSize * (document.body.clientWidth / 100));
          this.move = ss;
          lf.style.transition = 'left 150ms linear';
          lf.style.left = `${ss}px`;
          this.$bus.$emit('ifMargin', true);
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
        bottom: 40px;
        width: auto;
        z-index: 4;

        .playlist {
            -webkit-app-region: no-drag;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: flex-end;
            margin-left: 50px;

            .button {
                background-color: rgba(0, 0, 0, 0.12);
                backdrop-filter: blur(9.8px);
                margin-right: 15px;
                cursor: pointer;
            }

            .btnMask {
                border-radius: 2px;
                border: 1px solid rgb(55, 55, 55);
                display: flex;
            }

            .addUi {
                margin: auto;
            }

            .item {
                color: #e4e4c4;
                border-radius: 2px;
                width: 112 / 720vw;
                height: 63 / 405vh;
                min-height: 63px;
                min-width: 112px;
                color: gray;
                cursor: pointer;
                margin-right: 15px;
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center center;
                transition: width 150ms ease-out, height 150ms ease-out;
                display: flex;
                box-shadow: 0 20px 29px rgba(0, 0, 0, 0.3);
            }

            .mask {
                border-radius: 2px;
                display: none;
                border: 1.3px solid rgba(113, 113, 113, 0.53);
                box-shadow: 0 26px 39px rgba(0, 0, 0, 0.3), 0 5px 20px rgba(0, 0, 0, 0.14);
                transition: all 150ms;
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
                //box-shadow: 0 8px 30px rgba(0,0,0,0.3);
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
