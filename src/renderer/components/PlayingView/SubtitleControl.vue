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
          <li>{{curSubName}}</li>
        </ul>
      </div>
      <div
        @click.capture.stop.left="toggleButtonMenu">
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
      subtitleAppearFlag: false,
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
      this.$bus.$emit('subStyleChange', { fontSize: 50 });
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
      if (this.subtitleNameArr[curIndex]) {
        return this.$store.state.PlaybackState.SubtitleNameArr[curIndex].name;
      }
      return 'No subtitle';
    },
    isSelected() {
      return this.$store.state.PlaybackState.FirstSubIndex;
    },
  },
  watch: {
    // watch方法确定字幕有无状态
    subtitleNameArr() {
      if (this.subtitleNameArr.length !== 0) {
        this.subtitleAppearFlag = true;
      } else {
        this.subtitleAppearFlag = false;
      }
    },
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
      right: 31.25+35+12.5px;
    }
    .btn{
      position: absolute;
      bottom: 25px;
      right: 31.25+35+12.5px;
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
// .selected {
//   pointer-events: none;
//   cursor: default;
//   opacity: 0.6;
// }

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
