<template>
  <div class="sub-control">
    <transition name="fade" appear>
      <div class="sub-btn-control"
           v-if="isSubCtrlBtnAppear">
        <div class="sub-menu-wrapper"
             v-if="appearSubtitleMenu">
          <ul class="sub-menu">

            <li
              v-for="(item, index) in computedAvaliableItems"
              @click.stop="toggleItemClick(index)"
              @mouseover.stop.self="toggleItemsMouseOver"
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

            <li @click.stop="toggleSubtitleOff"
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


            <li
            v-if="!localSubAvaliable"
            ref="menuItem"
            class="sub-item"
            :class="{ chosen: itemIsChosen }"
            @mouseover.stop="toggleItemsMouseOver"
            @mouseleave.stop="toggleItemsMouseLeave"
            v-for="item in unavaliableSubtitlesItems">
              {{ item.title }}
            </li>
            </ul>
          </ul>
        </div>
        <div
          @mousedown.capture.stop.left="toggleSubtitleMenu">
          <img class='btn' type="image/svg+xml" wmode="transparent" src="~@/assets/icon-subtitle.svg" alt="Button">
        </div>
      </div>
    </transition>
  </div>
</template>



<script>
export default {
  data() {
    return {
      onlineSubsPlaceHolder: [
        { title: 'Placeholder - 1' },
        { title: 'Placeholder - 2' },
        { title: 'Placeholder - 3' },
      ],
      unavaliableSubtitlesItems: [
        { title: '加载翻译结果' },
        { title: '导入字幕文件...' },
      ],
      isSubCtrlBtnAppear: true,
      itemIsChosen: false,
      appearSubtitleMenu: false,
      localSubAvaliable: true,
      itemIsHover: false,
      preStyle: 'linear-gradient(-90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.10) 35%,rgba(255,255,255,0.00) 98%)',
      currentSubIden: 0,
    };
  },

  methods: {
    subCtrlBtnAppear() {
      this.isSubCtrlBtnAppear = true;
    },
    subCtrlBtnHide() {
      this.isSubCtrlBtnAppear = false;
      this.appearSubtitleMenu = false;
    },
    toggleSubtitleMenu() {
      if (!this.appearSubtitleMenu) {
        this.appearSubtitleMenu = true;
      } else {
        this.appearSubtitleMenu = false;
      }
    },
    toggleItemsMouseOver(e) {
      this.appearSubtitleMenu = true;
      this.isSubCtrlBtnAppear = true;
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
      return (this.$store.getters.subtitleNameArr.slice(0, 3));
    },
  },

  watch: {

  },

  created() {
    this.$bus.$on('sub-ctrl-appear', this.subCtrlBtnAppear);
    this.$bus.$on('sub-ctrl-hide', this.subCtrlBtnHide);
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


.video-controller .sub-control {
  position: absolute;
  bottom: 0;
  width: 100%;
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

  @media screen and (min-width: 320px) and (max-width: 511px) {
    .sub-menu-wrapper {
      display: none;
    }
    .btn {
      display: none;
    }
  }
  @media screen and (min-width: 512px) and (max-width: 853px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 50px;
      right: 26px;
      width: 170px;
      height: 232px;
    }
    .sub-menu{
      padding: 4px, 0px;
    }
    .menu-item-text-wrapper {
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
    .btn{
      position: absolute;
      bottom: 20px;
      right: 123px;
      height: 18px;
      width: 23px;
    }
  }
  @media screen and (min-width: 854px) and (max-width: 1919px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 64px;
      right: 30px;
      width: 184px;
      height: 260px;
    }
    .sub-menu{
      padding-top: 4px;
      padding-bottom: 12px;
    }
    .menu-item-text-wrapper {
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
    .btn{
      position: absolute;
      bottom: 24px;
      right: 160.3px;
      height: 30.7px;
      width: 24px;
    }
  }
  @media screen and (min-width: 1920px) {
    .sub-menu-wrapper {
      position: absolute;
      width: 283px;
      height: 400px;
      bottom: 100px;
      right: 42px;
    }
    .sub-menu{
      padding: 4px, 0px;
    }
    .menu-item-text-wrapper {
      line-height: 30px;
      width: 201px;
    }
    .chosen-dot {
      line-height: 20px;
      width: 6px;
      height: 6px;
      right: 0px;
      top: 50%;
      margin-top: -3px;
    }
    .chineseChosen {
      font-size: 20px;
    }
    li {
      margin-right: 15px;
      padding: 13px 27px;
      height: 56px;
      font-size: 20px;
    }
    .btn{
      position: absolute;
      bottom: 35px;
      right: 240px;
      width: 46;
      height: 36px;
    }
  }
}

.fade-enter-active {
 transition: opacity 100ms;
}

.fade-leave-active {
 transition: opacity 200ms;
}

.fade-enter-to, .fade-leave {
 opacity: 1;
}

.fade-enter, .fade-leave-to {
 opacity: 0;
}
</style>
