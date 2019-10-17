<template>
  <svg :class="hoverState">
    <use
      v-bind="{'xlink:href': `#${type}-${finalState}-${finalEffect}`}"
      class="default"
    />
    <use
      v-bind="{'xlink:href': `#${type}-hover-${finalEffect}`}"
      class="hover"
    />
    <use
      v-bind="{'xlink:href': `#${type}-active-${finalEffect}`}"
      class="active"
    />
  </svg>
</template>

<script lang="ts">
export default {
  name: 'Icon',
  props: {
    type: {
      type: String,
      required: true,
    },
    effect: {
      type: String,
      default: 'icon',
    },
    state: {
      type: String,
      default: 'default',
    },
    isFullScreen: {
      type: String,
      default: '',
    },
  },
  computed: {
    finalState() {
      return this.state === 'hover' && this.isFullScreen !== 'exit-fullscreen'
        ? this.state : 'default';
    },
    hoverState() {
      return this.state === 'hover' ? 'hoverState' : this.type;
    },
    finalEffect() {
      return this.effect ? this.effect : 'icon';
    },
  },
  watch: {
    type: {
      immediate: true,
      handler(type: string) {
        const defaultIcon = `${type}-${this.finalState}-${this.finalEffect}`;
        const hoverIcon = `${type}-hover-${this.finalEffect}`;
        const activeIcon = `${type}-active-${this.finalEffect}`;
        if (type && !document.getElementById(defaultIcon)) {
          try {
            // eslint-disable-next-line import/no-dynamic-require
            require(`@/assets/icon/${defaultIcon}.svg`);
          } catch (error) {
            // empty
          }
        }
        if (type && !document.getElementById(hoverIcon)) {
          try {
            // eslint-disable-next-line import/no-dynamic-require
            require(`@/assets/icon/${hoverIcon}.svg`);
          } catch (error) {
            // empty
          }
        }
        if (type && !document.getElementById(activeIcon)) {
          try {
            // eslint-disable-next-line import/no-dynamic-require
            require(`@/assets/icon/${activeIcon}.svg`);
          } catch (error) {
            // empty
          }
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.titleBarWinExitFull, .titleBarWinFull, .titleBarWinClose, .titleBarWinRestore, .titleBarWinResize {
  display: flex;
  width: 45px;
  height: 36px;
  margin: auto;
}
.hoverState {
  display: flex;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  background-repeat: no-repeat;
  -webkit-app-region: no-drag;
  border-radius: 100%;
  .default {
    opacity: 1;
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:active {
    .default {
      display: none;
    }
    .hover {
      display: none;
    }
    .active {
      display: block;
    }
  }
}
.titleBarFull, .titleBarExitFull, .titleBarClose, .titleBarRecover {
  display: flex;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  background-repeat: no-repeat;
  -webkit-app-region: no-drag;
  opacity: 0.5;
  border-radius: 100%;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:hover {
    opacity: 1;
    .default {
      display: none;
    }
    .hover {
      display: block;
    }
    .active {
      display: none;
    }
  }
  &:active {
    .default {
      display: none;
    }
    .hover {
      display: none;
    }
    .active {
      display: block;
    }
  }
}

.logo {
  width: 118px;
  height: 118px;
}
.add, .delete {
  width: 24px;
  height: 27px;
  display: block;
}

.volume {
  width: 100%;
  height: 100%;
}

.playlistplay {
  width: 100%;
  height: 100%;
}
.playlistpause {
  width: 100%;
  height: 100%;
}

.folder {
  width: 100%;
  height: 100%;
}

.play, .pause {
  margin: auto;
  width: 100%;
  height: 100%;
  display: block;
}

.nextStep {
  width: 100%;
  height: 100%;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 200ms;
  &:hover {
    opacity: 1;
  }
}

.nextStepDisable {
  width: 100%;
  height: 100%;
  opacity: 0.1;
}

.welcomeNike {
  width: 100%;
  height: 100%;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 200ms;
  &:hover {
    opacity: 1;
  }
}

.close {
  cursor: pointer;
  width: 100%;
  height: 100%;

  .default {
    transition: opacity 200ms;
    opacity: 1;
  }
  .hover {
    transition: opacity 200ms;
    opacity: 0;
  }
  .active {
    transition: opacity 200ms;
    opacity: 0;
  }

  &:hover {
    .default {
        opacity: 0;
    }
    .hover {
        opacity: 1;
    }
    .active {
        opacity: 0;
    }
  }
  &:active {
    .default {
        opacity: 0;
    }
    .hover {
        opacity: 0;
    }
    .active {
        opacity: 1;
    }
  }
}
.notificationPlay {
  width: 30px;
  height: 30px;
}
.notificationPlayHover {
  width: 30px;
  height: 30px;
}
.minus, .plus, .reset, .closeSquare {
  -webkit-app-region: no-drag;
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 11px;
    height: 11px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 13.2px;
    height: 13.2px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 18.48px;
    height: 18.48px;
  }
  margin-bottom: 5px;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:hover {
    .default {
      display: none;
    }
    .hover {
      display: block;
    }
    .active {
      display: none;
    }
  }
  &:active {
    .default {
      display: none;
    }
    .hover {
      display: none;
    }
    .active {
      display: block;
    }
  }
}
.hoveredEnd {
  display: block;
  z-index: 20;
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    width: 6px;
    height: 6px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 8px;
    height: 8px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 10px;
    height: 10px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 16px;
    height: 16px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .rightArrow {
    width: 13px;
    height: 13px;
  }
  .leftArrow, .leftArrowHover {
    display: block;
    width: 11px;
    height: 11px;
  }
  .refresh {
    display: block;
    width: 13px;
    height: 13px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .rightArrow {
    width: 15.6px;
    height: 15.6px;
  }
  .leftArrow, .leftArrowHover {
    display: block;
    width: 13.2px;
    height: 13.2px;
  }
  .refresh {
    display: block;
    width: 17px;
    height: 17px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .rightArrow {
    width: 21.84px;
    height: 21.84px;
  }
  .leftArrow, .leftArrowHover {
    display: block;
    width: 18.48px;
    height: 18.48px;
  }
  .refresh {
    display: block;
    width: 21px;
    height: 21px;
  }
}
.rightArrow {
  display: block;
  opacity: 0.5;
}
.nike {
  display: block;
  width: 14px;
  height: 15px;
}
.radio {
  display: block;
  width: 8px;
  height: 8px;
}
.speed {
  display: block;
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    width: 8px;
    height: 6px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 8px;
    height: 6px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 12px;
    height: 8.25px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 14px;
    height: 11px;
  }
}
.cycle {
  display: block;
  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    width: 11px;
    height: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 11px;
    height: 7px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 13px;
    height: 8px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 18px;
    height: 11.5px;
  }
}
.refresh {
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:hover {
    .default {
      display: none;
    }
    .hover {
      display: block;
    }
    .active {
      display: none;
    }
  }
}
.success {
  width: 15px;
  height: 15px;
}
.failed {
  width: 15px;
  height: 15px;
}
.deleteSub, .reload  {
  cursor: pointer;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:hover {
    .default {
      display: none;
    }
    .hover {
      display: block;
    }
    .active {
      display: none;
    }
  }
  &:active {
    .default {
      display: none;
    }
    .hover {
      display: none;
    }
    .active {
      display: block;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    width: 12px;
    height: 12px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    width: 14px;
    height: 14px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    width: 18.8px;
    height: 18.8px;
  }
}
.picInpic {
  width: 20px;
  height: 16px;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:active {
    .default {
      display: none;
    }
    .hover {
      display: none;
    }
    .active {
      display: block;
    }
  }
}
.picInpicDisabled {
  width: 20px;
  height: 16px;
  display: block;
}
.pin, .notPin {
  width: 100%;
  height: 100%;
}
.down {
  width: 5px;
  height: 7px;
}
.sidebar {
  width: 30px;
  height: 30px;
}
.channelSelected {
  width: 10px;
  height: 10px;
}
.bilibiliSidebar, .iqiyiSidebar, .youtubeSidebar, .channelManage, .courseraSidebar,
.douyuSidebar, .huyaSidebar, .qqSidebar, .youkuSidebar, .twitchSidebar {
  width: 44px;
  height: 44px;
}
.showMarks, .hideMarks, .closeSearch {
  width: 18px;
  height: 18px;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:hover {
    .default {
      display: none;
    }
    .hover {
      display: block;
    }
    .active {
      display: none;
    }
  }
}
.danmu, .noDanmu {
  width: 20px;
  height: 20px;
  display: block;
}
.showFavicon, .hideFavicon {
  width: 10px;
  height: 10px;
  display: block;
}
.closeInput {
  width: 10px;
  height: 10px;
  margin: auto;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:hover {
    .default {
      display: none;
    }
    .hover {
      display: block;
    }
    .active {
      display: none;
    }
  }
}
.videoRecordDisabled {
  display: block;
  width: 20px;
  height: 20px;
}
.history, .open {
  width: 30px;
  height: 30px;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  &:hover {
    .default {
      display: none;
    }
    .hover {
      display: block;
    }
  }
}
.pip, .pop, .pipDisabled, .popDisabled {
  width: 30px;
  height: 30px;
}
.pipRecord, .pipBack {
  width: 20px;
  height: 20px;
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  &:active {
    .default {
      display: none;
    }
    .hover {
      display: none;
    }
    .active {
      display: block;
    }
  }
}
</style>
