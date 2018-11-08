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
.titleBarWinMin, .titleBarWinMax, .titleBarWinClose, .titleBarWinRestore, .titleBarWinResize {
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
.titleBarMax, .titleBarMin, .titleBarClose, .titleBarRecover {
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

.advance, .subtitle, .listicon{
  @media screen and (min-width: 513px) and (max-width: 854px) {
    width: 26.4px;
    height: 22px;
  }
  @media screen and (min-width: 855px) and (max-width: 1920px) {
    width: 38.4px;
    height: 32px;
  }
  @media screen and (min-width: 1921px) {
    width: 60px;
    height: 50px;
  }
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
  width: 10px;
  height: 10px;
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
</style>
