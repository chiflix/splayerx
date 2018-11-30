<template>
  <div>
    <svg :class="hoverState">
      <use class='default' v-bind="{'xlink:href': `#${type}-${finalState}-${finalEffect}`}"></use>
      <use class="hover" v-bind="{'xlink:href': `#${type}-hover-${finalEffect}`}"></use>
      <use class="active" v-bind="{'xlink:href': `#${type}-active-${finalEffect}`}"></use>
    </svg>
  </div>
</template>

<script>
export default {
  name: 'Icon',
  props: {
    type: {
      type: String,
    },
    effect: {
      type: String,
    },
    state: {
      type: String,
    },
    isFullScreen: {
      type: String,
    },
  },
  computed: {
    finalState() {
      return this.state === 'hover' && this.isFullScreen !== 'exit-fullscreen' ? this.state : 'default';
    },
    hoverState() {
      return this.state === 'hover' ? 'hoverState' : this.type;
    },
    finalEffect() {
      return this.effect ? this.effect : 'icon';
    },
  },
  created() {
    const requireAll = requireContext => requireContext.keys().map(requireContext);
    const req = require.context('@/assets/icon', true, /\.svg$/);
    requireAll(req);
  },
};
</script>

<style lang="scss">
.titleBarWinExitFull, .titleBarWinFull, .titleBarWinClose, .titleBarWinRestore, .titleBarWinResize {
  display: flex;
  width: 45px;
  height: 28px;
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

.add, .delete {
  width: 24px;
  height: 27px;
  display: block;
}

.volume {
  @media screen and (min-width: 1921px) {
    width: 24px;
    height: 24px;
  }
  width: 12px;
  height: 12px;
}

.playlistplay {
  width: 100%;
  height: 100%;
}

.play, .pause {
  @media screen and (max-width: 512px) {
    width: 49px;
    height: 49px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 59px;
    height: 59px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 79px;
    height: 79px;
  }
  @media screen and (min-width: 1921px) {
    width: 109px;
    height: 108px;
  }
  display: block;
}

.close {
  .default {
    display: block;
  }
  .hover {
    display: none;
  }
  .active {
    display: none;
  }
  @media screen and (max-width: 512px) {
    width: 20px;
    height: 20px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 22px;
    height: 22px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 26px;
    height: 26px;
  }
  @media screen and (min-width: 1921px) {
    width: 36px;
    height: 36px;
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
.notificationPlay {
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 30.625px;
    height: 24.5px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 36.75px;
    height: 33.25px;
  }
  @media screen and (min-width: 1921px) {
    width: 51.625px;
    height: 46.375px;
  }
}
.notificationPlayHover {
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 30.625px;
    height: 24.5px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 36.75px;
    height: 33.25px;
  }
  @media screen and (min-width: 1921px) {
    width: 51.625px;
    height: 46.375px;
  }
}
.minus, .plus {
  -webkit-app-region: no-drag;
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 11px;
    height: 11px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 13.2px;
    height: 13.2px;
  }
  @media screen and (min-width: 1921px) {
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
  @media screen and (max-width: 512px) {
    width: 6px;
    height: 6px;
  }
  @media screen and (min-width: 513px) and(max-width: 854px) {
    width: 8px;
    height: 8px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 10px;
    height: 10px;
  }
  @media screen and (min-width: 1921px) {
    width: 16px;
    height: 16px;
  }
}
@media screen and (min-width: 513px) and (max-width: 854px) {
  .rightArrow {
    display: block;
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
    height: 14px;
  }
}
@media screen and (min-width: 855px) and (max-width: 1920px) {
  .rightArrow {
    display: block;
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
    width: 15px;
    height: 17px;
  }
}
@media screen and (min-width: 1921px) {
  .rightArrow {
    display: block;
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
    height: 24px;
  }
}
.speed {
  display: block;
  @media screen and (max-width: 512px) {
    width: 8px;
    height: 6px;
  }
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 8px;
    height: 6px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 12px;
    height: 8.25px;
  }
  @media screen and (min-width: 1921px) {
    width: 14px;
    height: 11px;
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
</style>
