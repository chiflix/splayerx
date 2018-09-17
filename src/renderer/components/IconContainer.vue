<template>
    <div>
        <svg :class="type">
            <use class="default" v-bind="{'xlink:href': `#${type}-default-${finalEffect}`}"></use>
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
  },
  computed: {
    finalEffect() {
      if (this.effect) {
        return this.effect;
      }
      return 'icon';
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
            background-position-y: 0;
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

    .advance {
        @media screen and (min-width: 513px) and (max-width: 854px) {
            width: 23px;
            height: 18px;
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
            width: 30.67px;
            height: 24px;
        }
        @media screen and (min-width: 1921px) {
            width: 46px;
            height: 36px;
        }
        display: block;
    }

    .subtitle {
        @media screen and (min-width: 513px) and (max-width: 854px) {
            width: 23px;
            height: 18px;
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
            width: 30.67px;
            height: 24px;
        }
        @media screen and (min-width: 1921px) {
            width: 46px;
            height: 36px;
        }
        display: block;
    }

    .volume {
        @media screen and (min-width: 513px) and (max-width: 854px) {
            width: 23px;
            height: 18px;
        }
        @media screen and (min-width: 855px) and (max-width: 1920px) {
            width: 30.67px;
            height: 24px;
        }
        @media screen and (min-width: 1921px) {
            width: 46px;
            height: 36px;
        }
        display: block;
    }

    .play {
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

    .pause {
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
</style>
