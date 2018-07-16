<template>
  <div class="subtitle-control">
    <transition name="fade" appear>
    <div class="btn-sub-ctrl"
      v-if="isSubCtrlBtnAppear">
      <div class='btn-menu-wrapper'
        v-show="isBtnMenuAppear">
        <ul class="btn-menu">
          <li class="btn-menu-item"
            @mousedown.stop.capture.left="firstSubtitleOn"
            :class="{show: subtitleAppearFlag}">
            <img src="" alt="On">
          </li>
          <li class="btn-menu-item"
            @mousedown.stop.capture.left="firstSubtitleOff"
            :class="{show: !subtitleAppearFlag}">
            <img src="" alt="Off">
          </li>
        </ul>
      </div>
      <div
        @mousedown.capture.stop.left="toggleButtonMenu">
        <img class='btn' type="image/svg+xml" wmode="transparent" src="~@/assets/icon-subtitle.svg" alt="Button">
      </div>
    </div>
    </transition>
  </div>
</template>;

<script>
export default {
  components: {

  },
  data() {
    return {
      // subtitleAppearFlag: false,
      isBtnMenuAppear: false,
      isSubCtrlBtnAppear: false,
      barBottom: 6,
      timeoutIdOfSubCtrlDisappearDelay: 0,
    };
  },
  methods: {
    subCtrlAppear() {
      this.isSubCtrlBtnAppear = true;
    },
    subCtrlHide() {
      this.isSubCtrlBtnAppear = false;
      this.isBtnMenuAppear = false;
    },
    firstSubtitleOn() {
      this.$store.commit('FirstSubtitleOn');
      this.$store.commit('SecondSubtitleOn');
    },
    firstSubtitleOff() {
      this.$store.commit('FirstSubtitleOff');
      this.$store.commit('SecondSubtitleOff');
    },
    secondSubtitleOn() {
      this.$store.commit('SecondSubtitleOn');
    },
    secondSubtitleOff() {
      this.$store.commit('SecondSubtitleOff');
    },
    // 需要refactor
    firstSubSelect(index) {
      this.$bus.$emit('subFirstChange', index);
    },
    secondSubSelect(index) {
      this.$bus.$emit('subSecondChange', index);
    },
    toggleButtonMenu() {
      this.$_clearTimeoutDelay();
      this.isBtnMenuAppear = !this.isBtnMenuAppear;
    },
    $_clearTimeoutDelay() {
      if (this.timeoutIdOfSubCtrlDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfSubCtrlDisappearDelay);
      }
    },
  },
  computed: {
    subtitleNameArr() {
      return this.$store.state.PlaybackState.SubtitleNameArr;
    },
    curSubName() {
      const curIndex = this.$store.state.PlaybackState.FirstSubIndex
        - this.$store.state.PlaybackState.StartIndex;
      if (this.subtitleNameArr[curIndex]) {
        return this.$store.state.PlaybackState.SubtitleNameArr[curIndex].title;
      }
      return 'No subtitle';
    },
    curFirstSubIndex() {
      return this.$store.state.PlaybackState.FirstSubIndex
        - this.$store.state.PlaybackState.StartIndex;
    },
    curSecondSubIndex() {
      console.log(this.$store.state.PlaybackState.SecondSubIndex);
      return this.$store.state.PlaybackState.SecondSubIndex
        - this.$store.state.PlaybackState.StartIndex;
    },

    subtitleAppearFlag() {
      return this.$store.state.PlaybackState.FirstSubtitleState;
    },
  },
  watch: {
  },
  created() {
    this.$bus.$on('sub-ctrl-appear', () => {
      this.subCtrlAppear();
      if (this.timeoutIdOfSubCtrlDisappearDelay !== 0) {
        clearTimeout(this.timeoutIdOfSubCtrlDisappearDelay);
        this.timeoutIdOfSubCtrlDisappearDelay
          = setTimeout(this.subCtrlHide, 3000);
      } else {
        this.timeoutIdOfSubCtrlDisappearDelay
          = setTimeout(this.subCtrlHide, 3000);
      }
    });
    this.$bus.$on('sub-ctrl-hide', () => {
      this.subCtrlHide();
    });
  },
};
</script>

<style lang="scss" scoped>
ul, li {
  list-style-type: none;
}
.video-controller .subtitle-control {
  position: absolute;
  bottom: 0;
  width: 100%;
  .btn:hover, .btn-menu-item:hover{
    cursor: pointer;
  }

  .show {
    pointer-events: none;
    cursor: default;
    color: yellow;
    opacity: 0.7;
  }

  .btn-menu-wrapper {
    background-color:rgba(255, 255, 255, 0.1)
  }


  @media screen and (max-width: 854px) {
    .btn-menu-wrapper {
      position: absolute;
      right: 25+28+10px;
      bottom: 22+30px;
    }
    .btn {
      position: absolute;
      bottom: 22px;
      right: 25+28+10px;
      height: 24px;
    }
  }
  @media screen and (min-width: 854px) and (max-width: 1920px) {
    .btn-menu-wrapper {
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
    .btn-menu-wrapper {
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
.firstSelected {
  pointer-events: none;
  cursor: default;
  background: red;
  opacity: 0.6;
}

.secondSelected {
  pointer-events: none;
  cursor: default;
  background: greenyellow;
  opacity: 0.6;
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
