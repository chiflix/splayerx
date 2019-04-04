<template>
  <div class="controller"
    :style="{
      left: this.isFullScreen ? '0px' : `${this.move}px`,
      bottom : this.winWidth > 1355 ? `${40 / 1355 * this.winWidth}px` : '40px',
      transition: tranFlag ? 'left 400ms cubic-bezier(0.42, 0, 0.58, 1)' : '',
    }">
    <div class="playlist no-drag"
      :style="{marginLeft: this.winWidth > 1355 ? `${50 / 1355 * this.winWidth}px` : '50px'}">
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
        :class="{ shadow: showShadow || !item.chosen }"
        :style="{
          bottom: item.chosen ? '9px' : '0',
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
            height: item.chosen ? `${thumbnailHeight + 10}px` : `${thumbnailHeight}px`,
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
import { mapGetters } from 'vuex';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'playlist',
  components: { Icon },
  data() {
    return {
      isTurnToOdd: false,
      backgroundUrl: '',
      showShortcutImage: false,
      landingLogoAppear: true,
      displayInfo: [],
      mouseDown: false,
      isDragging: false,
      disX: '',
      disY: '',
      recentFileDel: false,
      mouseFlag: true,
      showShadow: true,
      itemWidth: 112,
      itemHeight: 65,
      tranFlag: true,
      validHover: true,
      firstIndex: 0,
    };
  },
  props: {
    lastPlayedFile: {
      type: Object.Array,
      require: true,
      default: () => [],
    },
    isFullScreen: {
      type: Boolean,
      require: true,
    },
    winWidth: {
      type: Number,
      require: true,
    },
    filePathNeedToDelete: {
      type: String,
    },
  },
  destroyed() {
    document.onmousemove = null;
    document.onmouseup = null;
    window.onkeyup = null;
  },
  mounted() {
    this.$bus.$on('clean-lastPlayedFile', () => {
      this.firstIndex = 0;
    });
    window.onkeyup = (e) => {
      this.tranFlag = true;
      if (e.keyCode === 39) {
        this.validHover = false;
        this.tranFlag = true;
        this.lastIndex = this.lastPlayedFile.length;
      } else if (e.keyCode === 37) {
        this.validHover = false;
        this.tranFlag = true;
        this.firstIndex = 0;
      }
    };
  },
  computed: {
    ...mapGetters(['defaultDir']),
    lastIndex: {
      get() {
        return (this.firstIndex + this.showItemNum) - 1;
      },
      set(val) {
        if (val < this.showItemNum - 1) {
          this.firstIndex = 0;
        } else {
          this.firstIndex = (val - this.showItemNum) + 1;
        }
      },
    },
    move() {
      return -(this.firstIndex * (this.thumbnailWidth + this.marginRight));
    },
    marginRight() {
      return this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
    },
    thumbnailWidth() {
      let width = 0;
      const A = 50; // playlist left margin
      const B = 15; // space between each playlist item
      const C = 50; // the space between last playlist item and right edge of the screen
      if (this.winWidth > 512 && this.winWidth <= 1355) {
        width = ((((this.winWidth - A) - C) + B) / this.showItemNum) - B;
      } else if (this.winWidth > 1355) {
        width = this.winWidth * (112 / 1355);
      }
      return Math.round(width);
    },
    thumbnailHeight() {
      return Math.round((this.thumbnailWidth * 63) / 112);
    },
    showItemNum() {
      let number;
      if (this.winWidth < 720) {
        number = 5;
      } else if (this.winWidth >= 720 && this.winWidth <= 1355) {
        number = Math.floor(((this.winWidth - 720) / (112 + 15)) + 5);
      } else if (this.winWidth > 1355) {
        number = 10;
      }
      return number;
    },
  },
  watch: {
    winWidth() {
      this.tranFlag = false;
      if (this.isFullScreen) {
        this.windowFlag = false;
      } else if (this.firstIndex !== 0) {
        this.lastIndex = this.lastPlayedFile.length;
        this.windowFlag = true;
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
    open() {
      const { app } = this.$electron.remote;
      if (this.defaultDir) {
        this.openFilesByDialog();
      } else {
        const defaultPath = process.platform === 'darwin' ? app.getPath('home') : app.getPath('desktop');
        this.$store.dispatch('UPDATE_DEFAULT_DIR', defaultPath);
        this.openFilesByDialog({ defaultPath });
      }
    },
    openOrMove() {
      if (this.firstIndex === 1) {
        this.tranFlag = true;
        this.firstIndex = 0;
      } else if (this.winWidth > 1355) {
        this.open();
      } else {
        this.open();
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
      if (((index + 1 >= this.firstIndex && index + 1 <= this.lastIndex)
        || this.isFullScreen) && this.mouseFlag && this.validHover) {
        this.tranFlag = true;
        this.item = item;
        this.$set(this.lastPlayedFile[index], 'chosen', true);
        if (item.shortCut !== '') {
          this.isChanging = true;
          this.backgroundUrl = item.shortCut;
          this.landingLogoAppear = false;
          this.showShortcutImage = true;
        } else {
          this.landingLogoAppear = true;
          this.showShortcutImage = false;
        }
        this.displayInfo.landingLogoAppear = this.landingLogoAppear;
        this.displayInfo.showShortcutImage = this.showShortcutImage;
        this.displayInfo.backgroundUrl = this.itemShortcut(
          this.backgroundUrl,
          item.cover,
          this.itemInfo().lastTime,
          this.itemInfo().duration,
        );
        this.displayInfo.baseName = this.itemInfo().baseName;
        this.displayInfo.lastTime = this.itemInfo().lastTime;
        this.displayInfo.duration = this.itemInfo().duration;
        this.displayInfo.percentage = this.itemInfo().percentage;
        this.displayInfo.path = item.path;
        this.displayInfo.cover = item.cover;
        this.$emit('displayInfo', this.displayInfo);
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
          const limitWidth = vm.thumbnailWidth;
          const limitHeight = vm.thumbnailHeight;
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
        vm.showShadow = true;
        if (vm.recentFileDel) {
          vm.displayInfo.landingLogoAppear = true;
          vm.displayInfo.showShortcutImage = false;
          vm.$emit('displayInfo', vm.displayInfo);
          const deletData = vm.lastPlayedFile.splice(index, 1);
          vm.infoDB.delete('recent-played', deletData[0].quickHash);
          vm.recentFileDel = false;
        } else {
          item.style.zIndex = '';
          item.style.left = '';
          item.style.top = '';
        }
        if (vm.firstIndex !== 0) {
          vm.lastIndex = vm.lastPlayedFile.length;
        }
      }
      this.isDragging = false;
      if (index + 1 >= this.firstIndex && index + 1 <= this.lastIndex) {
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
      if (!this.isDragging) {
        this.validHover = false;
        this.tranFlag = true;
        if (index === this.lastIndex && !this.isFullScreen) {
          this.lastIndex = this.lastPlayedFile.length;
        } else if (index + 1 < this.firstIndex && !this.isFullScreen) {
          this.firstIndex = 0;
        } else if (!this.filePathNeedToDelete) {
          this.openVideoFile(item.path);
        }
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
      transition: bottom 100ms ease-in;
      position: relative;
      border-radius: $border-radius;
      cursor: pointer;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center center;
      background-color: rgb(60, 60, 60);
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
</style>
