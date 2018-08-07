<template>
  <div class="sub-control">
    <transition name="fade" appear>
      <div class="sub-btn-control"
           v-if="isSubCtrlBtnAppear">
        <div class="sub-menu-wrapper"
             v-if="appearSubtitleMenu">
          <ul class="sub-menu">
            <li
            v-if="localSubAvaliable"
            class="sub-item"
            v-for="item in avaliableSuntitlesItems">
              <div
                ref="menuItem"
                @mouseover.stop="toggleItemsMouseOver"
                :class="{ chosen: itemIsChosen }">
                {{ item.title }}
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
      avaliableSuntitlesItems: [
        { title: 'Chinese 1' },
        { title: 'English 1' },
        { title: 'Chinese / English' },
        { title: '人人影视.S05E04.CN' },
        { title: '迅雷字幕.S05E04.中文字幕' },
        { title: '迅雷字幕.S05E04.中英双语' },
        { title: '无' },
      ],
      unavaliableSubtitlesItems: [
        { title: '加载翻译结果' },
        { title: '导入字幕文件...' },
      ],
      isSubCtrlBtnAppear: true,
      itemIsChosen: false,
      appearSubtitleMenu: false,
      localSubAvaliable: true,
      mouseOverDisItem: false,
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
    toggleItemsMouseOver() {
      this.itemIsChosen = true;
    },
  },

  computed: {
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

.video-controller .sub-control {
  position: absolute;
  bottom: 0;
  width: 100%;
  .btn:hover, .sub-item:hover{
    cursor: pointer;
  }

  .chosenFake {
    pointer-events: none;
    cursor: default;
    color: yellow;
    opacity: 0.7;
  }

  .sub-menu-wrapper {

  }

  @media screen and (max-width: 639px) {
    .sub-menu-wrapper {
      position: absolute;
      right: 25+28+10px;
      bottom: 22+30px;
    }
    .btn {
      position: absolute;
      bottom: 22px;
      right: 101px;
      height: 28px;
      width: 24px;
    }
  }
  @media screen and (min-width: 640px) and (max-width: 853px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 62px;
      right: 18px;
      width: 184px;
      height: 244px;
      border-radius: 20px;
    }
    .sub-menu{
      top: 4px;
      bottom: 4px;
    }
    .sub-item{

    }
    ul {
      border-radius: 20px;
      clip-path: inset(0px round 20px);
      // clip-path: circle(50px at 0 100px);
      // background-clip: padding-box;
      padding-top: 4px;
      padding-bottom: 4px;
      background-color:rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(20px);
    }
    li {
      padding-left: 18px;
      padding-right: 18px;
      margin-right: 18px;
      padding-top: 8px;
      padding-bottom: 8px;
      left: 10px;
      height: 36px;
      text-align: left;
      font-family: Avenir-Roman;
      font-size: 15px;
      overflow:hidden; //超出的文本隐藏
      white-space:nowrap;
    }
    .btn{
      position: absolute;
      bottom: 25px;
      right: 104px;
      height: 17px;
      width: 23px;
    }
  }
  @media screen and (min-width: 854px) and (max-width: 1919px) {
    .sub-menu-wrapper {
      position: absolute;
      bottom: 60px;
      right: 31.25+35+35+12.5+12.5px;
    }
    .btn{
      position: absolute;
      bottom: 25px;
      right: 31.25+35+35+12.5+12.5px;
      height: 30px;
    }
  }
  @media screen and (min-width: 1920px) {
    .sub-menu-wrapper {
      position: absolute;
      width: 24px;
      bottom: 60px;
      right: 50+56+20px;
    }
    .btn{
      position: absolute;
      bottom: 40px;
      right: 50+56+20px;
      height: 48px;
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
