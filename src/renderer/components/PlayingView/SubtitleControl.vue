<template>
  <div
    :data-component-name="$options.name"
    class="sub-control">
      <div class="sub-btn-control">
        <transition name="sub-trans-l">
          <div class="sub-menu-wrapper"
            v-show="showAttached"
            :style="{ transition: showAttached ? '80ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' : '150ms cubic-bezier(0.17, 0.67, 0.17, 0.98)' }">
            <div class="element bottom"><div class="element middle"><div class="element content"></div></div></div>
            <ul class="sub-menu">

              <li
                v-if="foundSubtitles"
                v-for="(item, index) in computedAvaliableItems"
                @mouseup="toggleItemClick(index)"
                @mouseover.stop.self="toggleItemsMouseOver(index)"
                @mouseleave="toggleItemsMouseLeave(index)"
                :class="{ chosenText: itemHasBeenChosen(index) }"
                :id="'item' + index">
                <div class="menu-item-text-wrapper"
                  :class="{ chineseChosen: itemTitleHasChineseChar(item.title) }"
                  :style="{ color: itemHasBeenChosen(index) ? 'rgba(255, 255, 255, 0.8)' : '' }">
                  {{ item.title }}
                </div>
              </li>

              <li v-if="loadingPlaceholderList.length > 0"
                v-for="(item, index) in loadingPlaceholderList"
                class="placeholders-wrapper">
                <div class="placeholder-item-text-wrapper"
                  :class="{ chineseChosen: itemTitleHasChineseChar(item.title) }">
                  {{ item }}
                </div>
              </li>


              <li v-if="foundSubtitles && !(loadingSubsPlaceholders.length > 0)"
                @mouseup="toggleSubtitleOff"
                @mouseover.stop.self="toggleItemsMouseOver(-1)"
                @mouseleave="toggleItemsMouseLeave(-1)"
                :class="{ chosenText: itemHasBeenChosen(-1) }"
                id="item-1">
                <div class="menu-item-text-wrapper"
                  :style="{ color: itemHasBeenChosen(-1) ? 'rgba(255, 255, 255, 0.8)' : '' }">
                  无
                </div>
              </li>


              <li v-if="!foundSubtitles"
                :class="{ chineseChosen: itemTitleHasChineseChar('加载翻译结果') }"
                @mouseover.stop="toggleItemsMouseOver(-2)"
                @mouseleave.stop.self="toggleItemsMouseLeave(-2)"
                @mouseup="toggleLoadServerSubtitles"
                id="item-2">
                <div class="menu-item-text-wrapper">
                  加载翻译结果
                </div>
              </li>
              <li v-if="!foundSubtitles"
                :class="{ chineseChosen: itemTitleHasChineseChar('导入本地字幕 ...') }"
                @mouseover.self.stop="toggleItemsMouseOver(-3)"
                @mouseleave.stop.self="toggleItemsMouseLeave(-3)"
                @mouseup="toggleOpenFileDialog"
                id="item-3">
                <div class="menu-item-text-wrapper">
                  导入本地字幕 ...
                </div>
              </li>

            </ul>
          </div>
        </transition>
        <div ref="sub" @mouseup.left="toggleSubMenuDisplay" @mousedown.left="handleDown" @mouseenter="handleEnter" @mouseleave="handleLeave" >
          <lottie v-on:animCreated="handleAnimation" :options="defaultOptions" lot="subtitle"></lottie>
        </div>
      </div>
  </div>
</template>
<script>
import lottie from '@/components/lottie.vue';
import * as animationData from '@/assets/subtitle.json';
export default {
  name: 'subtitle-control',
  props: {
    showAttached: Boolean,
    mousedownOnOther: Boolean,
    mouseupOnOther: Boolean,
  },
  data() {
    return {
      loadingSubsPlaceholders: {
        local: '',
        embedded: '',
        server: '',
      },
      foundSubtitles: true,
      showingPopupDialog: false,
      preStyle: 'linear-gradient(-90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.10) 35%,rgba(255,255,255,0.00) 98%)',
      currentSubIden: 0,
      clicks: 0,
      defaultOptions: { animationData },
      anim: {},
      animFlag: true,
      mouseDown: false,
      validEnter: false,
      showFlag: false,
    };
  },
  components: {
    lottie,
  },
  watch: {
    showAttached(val) {
      if (!val) {
        this.animFlag = true;
        if (!this.validEnter) {
          this.anim.playSegments([79, 98], false);
        } else {
          this.showFlag = true;
          this.anim.playSegments([79, 92], false);
          setTimeout(() => { this.showFlag = false; }, 250);
        }
      }
    },
    mousedownOnOther(val) {
      if (val && this.showAttached) {
        this.anim.playSegments([62, 64], false);
        if (this.mouseupOnOther) {
          this.$emit('update:showAttached', false);
        }
      }
    },
    mouseupOnOther(val) {
      if (val && this.showAttached) {
        this.$emit('update:showAttached', false);
      }
    },
  },
  methods: {
    handleAnimation(anim) {
      this.anim = anim;
    },
    handleDown() {
      this.mouseDown = true;
      if (!this.showAttached) {
        this.anim.playSegments([28, 32], false);
      } else {
        this.anim.playSegments([62, 64], false);
      }
      document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          if (!this.showAttached) {
            if (this.validEnter) {
              this.anim.playSegments([46, 60], false);
            } else if (!this.mousedownOnOther) {
              this.anim.playSegments([40, 44], false);
            }
          }
          this.mouseDown = false;
        }
      });
    },
    handleEnter() {
      if (this.animFlag && !this.showAttached) {
        if (!this.mouseDown) {
          this.anim.playSegments([4, 8], false);
        } else {
          this.anim.playSegments([102, 105], false);
        }
      }
      this.showFlag = false;
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (!this.showAttached) {
        if (this.mouseDown) {
          this.anim.playSegments([35, 38], false);
        } else if (this.showFlag) {
          this.anim.addEventListener('complete', () => {
            this.anim.playSegments([95, 98], false);
            this.showFlag = false;
            this.anim.removeEventListener('complete');
          });
        } else {
          this.anim.playSegments([95, 98], false);
        }
        this.animFlag = true;
      }
      this.validEnter = false;
    },
    toggleSubMenuDisplay() {
      this.clicks = this.showAttached ? 1 : 0;
      this.clicks += 1;
      switch (this.clicks) {
        case 1:
          this.$emit('update:showAttached', true);
          break;
        case 2:
          this.$emit('update:showAttached', false);
          this.clicks = 0;
          break;
        default:
          this.clicks = 0;
          break;
      }
    },
    toggleItemsMouseOver(index) {
      document.querySelector(`#item${index}`).style.backgroundImage = this.preStyle;
      if (this.currentSubIden !== index) {
        document.querySelector(`#item${index} .menu-item-text-wrapper`).style.color = 'rgba(255, 255, 255, 0.7)';
      }
    },
    toggleItemsMouseLeave(index) {
      document.querySelector(`#item${index}`).style.backgroundImage = 'none';
      if (this.currentSubIden !== index) {
        document.querySelector(`#item${index} .menu-item-text-wrapper`).style.color = 'rgba(255, 255, 255, 0.6)';
      }
    },
    toggleItemClick(index) {
      this.currentSubIden = index;
      this.$bus.$emit('sub-first-change', index);
    },
    toggleSubtitleOff() {
      this.currentSubIden = -1;
      this.$bus.$emit('first-subtitle-off');
    },
    toggleLoadServerSubtitles() {
      this.$bus.$emit('load-server-transcripts');
    },
    toggleOpenFileDialog() {
      if (this.showingPopupDialog) {
        return;
      }
      const self = this;
      const { remote } = this.$electron;
      const { dialog } = remote;
      const browserWindow = remote.BrowserWindow;
      const focusWindow = browserWindow.getFocusedWindow();
      const VALID_EXTENSION = ['ass', 'srt', 'vtt'];

      self.showingPopupDialog = true;
      dialog.showOpenDialog(focusWindow, {
        title: 'Open Dialog',
        defaultPath: './',
        filters: [{
          name: 'Subtitle Files',
          extensions: VALID_EXTENSION,
        }],
        properties: ['openFile'],
      }, (item) => {
        self.showingPopupDialog = false;
        if (item) {
          self.$bus.$emit('add-subtitle', item);
        }
      });
    },
    itemHasBeenChosen(index = 0) {
      return index === this.currentSubIden;
    },
    itemTitleHasChineseChar(str) {
      const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;
      return (REGEX_CHINESE.test(str));
    },
  },
  computed: {
    computedAvaliableItems() {
      return this.$store.getters.subtitleNames;
    },
    loadingPlaceholderList() {
      const res = [];
      if (this.loadingSubsPlaceholders.local !== '') {
        res.push('Local loading');
      }
      if (this.loadingSubsPlaceholders.embedded !== '') {
        res.push('Embedded loading');
      }
      if (this.loadingSubsPlaceholders.server !== '') {
        res.push('Server loading');
      }
      return res;
    },
  },
  created() {
    this.$bus.$on('loading-subtitles', (status) => {
      this.foundSubtitles = true;
      const placeholderText = 'Loading...';
      if (status.type === 'Local') {
        this.loadingSubsPlaceholders.local = placeholderText;
      } else if (status.type === 'Embedded') {
        this.loadingSubsPlaceholders.embedded = placeholderText;
      } else {
        this.loadingSubsPlaceholders.server = placeholderText;
      }
    });
    this.$bus.$on('subtitles-finished-loading', (type) => {
      if (type === 'Local') {
        this.loadingSubsPlaceholders.local = '';
      }
      if (type === 'Embedded') {
        this.loadingSubsPlaceholders.embedded = '';
      }
      if (type === 'Server') {
        this.loadingSubsPlaceholders.server = '';
      }
    });
    this.$bus.$on('toggle-no-subtitle-menu', () => {
      this.foundSubtitles = false;
      this.$store.commit('SubtitleOff');
    });
    this.$bus.$on('finished-loading-server-subs', () => {
      this.foundSubtitles = true;
    });
    this.$bus.$on('added-local-subtitles', (index) => {
      this.foundSubtitles = true;
      this.currentSubIden = index;
    });
    this.$bus.$on('new-video-opened', () => {
      this.currentSubIden = 0;
    });
  },
};
</script>
<style lang="scss" scoped>
ul, li {
  list-style-type: none;
}
li {
  cursor: pointer;
}

.sub-control {
  .btn:hover, .sub-item:hover{
    cursor: pointer;
  }

  .sub-trans-l-enter, .sub-trans-l-enter-active {
    transform: translateY(0px);
  }
  .sub-trans-l-enter, .sub-trans-l-leave-active {
    transform: translateY(20px);
  }

  .sub-menu-wrapper {
    transition-property: opacity, transform;
    border-radius: 10px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    box-sizing: content-box;
    .element {
      border-radius: 7px;
      position: absolute;
      box-sizing: inherit;
    }
    .bottom {
      width: 100%;
      height: 100%;
      top: 0;
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);
      clip-path: inset(0 round 7px);
    }
    .middle {
      width: 100%;
      height: 100%;
      top: 0;
      background: rgba(255, 255, 255, 0.2);
    }
    .content {
      width: calc(100% - 2px);
      height: calc(100% - 2px);
      top: 1px;
      left: 1px;
      background-color: transparent;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
    }
  }
  .menu-item-text-wrapper {
    overflow: hidden; //超出的文本隐藏
    white-space: nowrap;
    text-overflow: ellipsis;
    -webkit-background-clip: text;
    color: rgba(255, 255, 255, 0.6);
    text-transform: capitalize;
  }
  .placeholder-item-text-wrapper {
    overflow: hidden; //超出的文本隐藏
    white-space: nowrap;
    text-overflow: ellipsis;
    -webkit-background-clip: text;
    color: grey;
  }
  .placeholders-wrapper {
    cursor: default;
  }
  .chosenText{
    /*font-weight: bold;*/
  }
  li {
    position: relative;
    text-align: left;
  }
  @media screen and (min-width: 320px) and (max-width: 512px) {
    .sub-menu-wrapper {
      display: none;
    }
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 32px;
      left: -58px;
      width: 170px;
    }
    .sub-menu{
      padding: 8px, 0px;
    }
    .menu-item-text-wrapper {
      line-height: 14px;
      width: 136px;
      letter-spacing: 0.2px;
    }
    .placeholder-item-text-wrapper {
      line-height: 14px;
      width: 136px;
      letter-spacing: 0.2px;
    }
    .chineseChosen {
      font-size: 13px;
    }
    ul {
      padding: 8px 0px;
    }
    li {
      font-size: 13px;
      padding: 12px 17px;
      height: 37px;
    }
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 44px;
      left: -42px;
      width: 204px;
    }
    .sub-menu{
      padding-top: 4px;
      padding-bottom: 4px;
    }
    .menu-item-text-wrapper {
      line-height: 16px;
      width: 164px;
      letter-spacing: 0.21px;
    }
    .placeholder-item-text-wrapper {
      line-height: 16px;
      width: 164px;
      letter-spacing: 0.21px;
    }
    .chineseChosen {
      font-size: 15px;
    }
    li {
      padding: 16px 20px;
      height: 45px;
      font-size: 15px;
    }
  }
  @media screen and (min-width: 1921px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 70px;
      left: -71px;
      width: 286px;
    }
    .sub-menu{
      padding-top: 4px;
      padding-bottom: 4px;
    }
    .menu-item-text-wrapper {
      line-height: 20px;
      width: 230px;
      letter-spacing: 0.3px;
    }
    .placeholder-item-text-wrapper {
      line-height: 20px;
      width: 230px;
      letter-spacing: 0.3px;
    }
    .chineseChosen {
      font-size: 19px;
    }
    li {
      padding: 22px 28px;
      height: 63px;
      font-size: 19px;
    }
  }
}

.sub-trans-l-enter-active, .sub-trans-l-leave {
  opacity: 1;
}
.sub-trans-l-enter, .sub-trans-l-leave-active {
  opacity: 0;
}
.sub-trans-l-leave-active {
  position: absolute;
}
</style>
