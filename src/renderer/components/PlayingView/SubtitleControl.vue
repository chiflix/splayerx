<template>
  <div class="subtitle-control">
    <!-- <div class="subtitle-control-board"
      v-show="subtitleAppearFlag"
      :style="{bottom: barBottom + 'vw'}">
      <div class="subtitle-menu-wrapper"
        v-show="subtitleMenuAppearFlag">
        <ul class="subtitle-menu">
          <li class="subtitle-menu-item"
            v-for="item in subtitleNameArr"
            :key="item.index"
            @click.capture.stop.left="firstSubSelect(item.index)">
            {{item.name}}
          </li>
        </ul>
      </div>
      <div class="subtitle-menu-wrapper"
        v-show="subSecondMenuAppearFlag">
        <ul class="subtitle-menu">
          <li class="subtitle-menu-item"
            v-for="item in subtitleNameArr"
            :key="item.index"
            :class="{selected: item.index === isSelected}"
            @click.capture.stop.left="secondSubSelect(item.index)">
            {{item.name}}
          </li>
        </ul>
      </div>
      <div class="subtitle-menu-button"
        v-if="subtitleLoadedFlag" 
        @click.capture.stop.left="toggleSubtitleMenu">
        {{curSubName}}
      </div>
      <div class="second-sub-button"
        v-if="subtitleLoadedFlag"
        @click.capture.stop.left="toggleSecondSubMenu">
        +
      </div>
      <div class='second-sub-ctl'
        @click.capture.stop.left="toggleSecondSub">
        second-sub-control
      </div>
    </div> -->
    <transition name="fade" appear>
    <div class="btn-sub-ctrl"
      v-if="subCtrlBtnAppearFlag">
      <div class='btn-menu-wrapper'
        v-show="btnMenuAppearFalg">
        <ul class="btn-menu">
          <li class="btn-menu-item"
            @click.stop.capture.left="showSubtitle"
            :class="{show: subtitleAppearFlag}">
            <img src="" alt="Show">
          </li>
          <li class="btn-menu-item"
            @click.stop.capture.left="showSubtitle"
            :class="{show: !subtitleAppearFlag}">
            <img src="" alt="Close">
          </li>
        </ul>
      </div>
      <div class='btn-wrapper'
        @click.capture.stop.left="toggleButtonMenu">
        <img src="~@/assets/icon-subtitle.svg" alt="Button">
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
      subtitleAppearFlag: true,
      subtitleCtrlAppearFlag: true,
      subtitleMenuAppearFlag: false,
      subSecondMenuAppearFlag: false,
      subtitleLoadedFlag: false,
      btnMenuAppearFalg: false,
      subCtrlBtnAppearFlag: false,
      barBottom: 6,
      timeoutIdOfSubCtrlDisappearDelay: 0,
    };
  },
  methods: {
    subCtrlAppear() {
      this.subCtrlBtnAppearFlag = true;
    },
    subCtrlHide() {
      this.subCtrlBtnAppearFlag = false;
    },
    showSubtitle() {
      this.subtitleAppearFlag = !this.subtitleAppearFlag;
      this.$bus.$emit('toggleSubtitle');
    },
    toggleSecondSub() {
      // 关闭第二字幕和取消第二字幕的两套逻辑
      // 加一个flag确定开关，控制高度
      this.$bus.$emit('toggleSecondSub');
      this.barBottom = 6;
    },
    toggleSubtitleCtrl() {
      this.subtitleCtrlAppearFlag = !this.subtitleCtrlAppearFlag;
    },
    toggleSubtitleMenu() {
      this.subtitleMenuAppearFlag = !this.subtitleMenuAppearFlag;
    },
    toggleSecondSubMenu() {
      this.subSecondMenuAppearFlag = !this.subSecondMenuAppearFlag;
    },
    // 需要refactor
    firstSubSelect(index) {
      // console.log(index);
      this.$bus.$emit('subFirstChange', index);
    },
    secondSubSelect(index) {
      this.barBottom = 14;
      this.$bus.$emit('subSecondChange', index);
    },
    toggleButtonMenu() {
      this.$_clearTimeoutDelay();
      this.btnMenuAppearFalg = !this.btnMenuAppearFalg;
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
      return this.$store.state.PlaybackState.SubtitleNameArr[curIndex].name;
    },
    isSelected() {
      return this.$store.state.PlaybackState.FirstSubIndex;
    },
  },
  watch: {

  },
  created() {
    // this.$bus.$on('subtitle-loaded', () => {
    //   this.subtitleLoadedFlag = true;
    // });
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

<style lang="scss">
.video-controller .subtitle-control {
  position: absolute;
  bottom: 0;
  width: 100%;

  // .subtitle-background {
  //   position: absolute;
  //   width: 100%;
  //   height: 300px;
  //   backdrop-filter: blur(30px);
  //   background-color: white;
  //   opacity: 0.3;
  //   bottom: 0;
  //   // z-index: 30;

  // }
  .subtitle-control-board {
    position: relative;
    // bottom: 5vw;
    text-align: center;
  }
  .subtitle-menu-button {
    display: inline;
  }
  .second-sub-button {
    display: inline;
  }
  .subtitle-menu-button:hover, .second-sub-button:hover {
    cursor: pointer;
  }
}
.video-controller .btn-sub-ctrl {
  position: absolute;
  bottom: 10px;
  right: 90px;
}
.video-controller .btn-sub-ctrl:hover {
  cursor: pointer;
}

.subtitle-menu-item:hover {
  cursor: pointer;
}

.subtitle-menu-wrapper {
  background-color: rgba(0, 0, 0, 0.3)
}
.selected {
  pointer-events: none;
  cursor: default;
  opacity: 0.6;
}
.show {
  pointer-events: none;
  cursor: default;
  color: red;
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
