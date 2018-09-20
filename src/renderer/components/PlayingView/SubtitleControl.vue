<template>
  <div
    :data-component-name="$options.name"
    class="sub-control">
      <div class="sub-btn-control">
        <div class="sub-menu-wrapper"
             v-show="showAttached">
          <ul class="sub-menu">

            <li
              v-if="foundSubtitles"
              v-for="(item, index) in computedAvaliableItems"
              @mouseup="toggleItemClick(index)"
              @mouseover.self.stop="toggleItemsMouseOver"
              @mouseleave.stop.self="toggleItemsMouseLeave"
              :class="{ chosenText: itemHasBeenChosen(index) }">
              <div class="menu-item-text-wrapper"
                   :class="{ chineseChosen: itemTitleHasChineseChar(item.title) }">
                {{ item.title }}
              </div>
              <div class="chosen-dot"
                   v-if="itemHasBeenChosen(index)">
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
            @mouseover.stop.self="toggleItemsMouseOver"
            @mouseleave.stop.self="toggleItemsMouseLeave"
            :class="{ chosenText: itemHasBeenChosen(-1) }">
              <div class="menu-item-text-wrapper">
                无
              </div>
              <div class="chosen-dot"
                   v-if="itemHasBeenChosen(-1)">
              </div>
            </li>


            <li v-if="!foundSubtitles"
                :class="{ chineseChosen: itemTitleHasChineseChar('加载翻译结果') }"
                @mouseover.self.stop="toggleItemsMouseOver"
                @mouseleave.stop.self="toggleItemsMouseLeave"
                @mouseup="toggleLoadServerSubtitles">
                <div class="menu-item-text-wrapper">
                  加载翻译结果
                </div>
            </li>
            <li v-if="!foundSubtitles"
                :class="{ chineseChosen: itemTitleHasChineseChar('导入本地字幕 ...') }"
                @mouseover.self.stop="toggleItemsMouseOver"
                @mouseleave.stop.self="toggleItemsMouseLeave"
                @mouseup="toggleOpenFileDialog">
                <div class="menu-item-text-wrapper">
                  导入本地字幕 ...
                </div>
            </li>

          </ul>
        </div>
        <div @mousedown.left="toggleSubMenuDisplay">
          <Icon type="subtitle" wmode="transparent" alt="Button"></Icon>
        </div>
      </div>
  </div>
</template>
<script>
import Icon from '../IconContainer';
export default {
  name: 'subtitle-control',
  props: {
    showAttached: Boolean,
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
    };
  },
  components: {
    Icon,
  },
  methods: {
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
    toggleItemsMouseOver(e) {
      e.target.style.backgroundImage = this.preStyle;
    },
    toggleItemsMouseLeave(e) {
      e.target.style.backgroundImage = 'none';
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
      return this.$store.getters.subtitleNameArr;
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

button {
  border: none;
}
button:focus {
  outline: none;
}
button:hover {
  cursor: pointer;
}

.sub-control {
  .btn:hover, .sub-item:hover{
    cursor: pointer;
  }

  .sub-menu-wrapper {
    border-radius: 10px;
  }
  .sub-menu {
    bottom: 0px;
    position: absolute;
  }
  .menu-item-text-wrapper {
    overflow: hidden; //超出的文本隐藏
    white-space: nowrap;
    background: linear-gradient(to right, white 75%, rgba(0, 0, 0, 0) 95%, rgba(0, 0, 0, 0) 100%);
    -webkit-background-clip: text;
    color: transparent;
    text-transform: capitalize;
  }
  .placeholder-item-text-wrapper {
    overflow: hidden; //超出的文本隐藏
    white-space: nowrap;
    background: linear-gradient(to right, white 75%, rgba(0, 0, 0, 0) 95%, rgba(0, 0, 0, 0) 100%);
    -webkit-background-clip: text;
    color: grey;
  }
  .placeholders-wrapper {
    cursor: default;
  }
  .chosenText{
    font-family: Avenir-Heavy;
  }
  .chosen-dot {
    content: '';
    display: inline-block;
    position: absolute;
    line-height: 18px;
    background-color: white;
    border-radius: 100%;
  }
  ul {
    border-radius: 10px;
    clip-path: inset(0px round 10px);
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(20px);
  }
  li {
    position: relative;
    text-align: left;
    font-family: Avenir-Roman;
  }

  @media screen and (min-width: 320px) and (max-width: 512px) {
    .sub-menu-wrapper {
      display: none;
    }
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 30px;
      right: -97px;
      width: 170px;
      // height: 232px;
    }
    .sub-menu{
      padding: 4px, 0px;
    }
    .menu-item-text-wrapper {
      line-height: 18px;
      width: 136px;
    }
    .placeholder-item-text-wrapper {
      line-height: 18px;
      width: 136px;
    }
    .chosen-dot {
      width: 4px;
      height: 4px;
      right: 0px;
      top: 50%;
      margin-top: -2px;
    }
    .chineseChosen {
      font-size: 12px;
    }
    ul {
      padding: 4px 0px;
    }
    li {
      margin-right: 15px;
      padding: 7px 17px;
      height: 32px;
      font-size: 14px;
    }
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 40px;
      right: -198px;
      width: 283.1px;
      // height: 260px;
    }
    .sub-menu{
      padding-top: 4px;
      padding-bottom: 4px;
    }
    .menu-item-text-wrapper {
      line-height: 20px;
      width: 148px;
    }
    .placeholder-item-text-wrapper {
      line-height: 20px;
      width: 148px;
    }
    .chosen-dot {
      line-height: 20px;
      width: 4px;
      height: 4px;
      right: 0px;
      top: 50%;
      margin-top: -2px;
    }
    .chineseChosen {
      font-size: 13px;
    }
    li {
      margin-right: 15px;
      padding: 8px 18px;
      height: 36px;
      font-size: 15px;
    }
  }
  @media screen and (min-width: 1921px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 100px;
      right: -130.3px;
      width: 184px;
      // height: 260px;
    }
    .sub-menu{
      padding-top: 4px;
      padding-bottom: 4px;
    }
    .menu-item-text-wrapper {
      line-height: 30px;
      width: 201px;
    }
    .placeholder-item-text-wrapper {
      line-height: 30px;
      width: 201px;
    }
    .chosen-dot {
      line-height: 30px;
      width: 6.2px;
      height: 6.2px;
      right: 0px;
      top: 50%;
      margin-top: -3.1px;
    }
    .chineseChosen {
      font-size: 20px;
    }
    li {
      margin-right: 28px;
      padding: 13px 27px;
      height: 56px;
      font-size: 23px;
    }
  }
}
</style>
