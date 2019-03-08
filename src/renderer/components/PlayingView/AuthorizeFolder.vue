<template>
  <div class="authorize-item"
    :class="mouseover ? 'background-image-in' : 'background-image-out'"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
    @mousedown="handleMousedown"
    :style="{
      marginRight: sizeAdaption(15),
      minWidth: `${thumbnailWidth}px`,
      minHeight: `${thumbnailHeight}px`,
    }">
    <div class="container"
      :style="{
        height: `${thumbnailHeight - bottom}px`,
        width: `${thumbnailWidth}px`,
        paddingLeft: `${side}px`,
      }">
      <div class="icon-container"
        :style="{
          width: `${thumbnailWidth}px`,
        }">
        <Icon type="folder"
          :style="{
            width: sizeAdaption(10),
            height: sizeAdaption(16),
            marginRight: sizeAdaption(4),
          }"/>
        <div class="content"
          :style="{
            lineHeight: sizeAdaption(16),
            color: mouseover ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.4)',
            fontSize: sizeAdaption(12),
          }">{{ $t('recentPlaylist.briefAuthorize') }}</div>
      </div>
    </div>
  </div>
</template>
<script>
import Icon from '@/components/BaseIconContainer.vue';
import path from 'path';

export default {
  components: {
    Icon,
  },
  props: {
    thumbnailWidth: {
      type: Number,
      default: 112,
    },
    sizeAdaption: {
      type: Function,
    },
    winWidth: {
      type: Number,
    },
    onAuthorizeMouseover: {
      type: Function,
    },
    onAuthorizeMouseout: {
      type: Function,
    },
  },
  data() {
    return {
      mouseover: false,
    };
  },
  methods: {
    handleMouseenter() {
      this.mouseover = true;
      this.onAuthorizeMouseover();
    },
    handleMouseleave() {
      this.mouseover = false;
      this.onAuthorizeMouseout();
    },
    handleMousedown() {
      this.openFilesByDialog({
        defaultPath: path.dirname(this.$store.getters.originSrc),
      });
    },
  },
  computed: {
    thumbnailHeight() {
      return this.thumbnailWidth / (112 / 63);
    },
    side() {
      return this.winWidth > 1355 ? this.thumbnailWidth / (112 / 14) : 14;
    },
    bottom() {
      return this.winWidth > 1355 ? this.thumbnailWidth / (112 / 14) : 14;
    },
  },
};
</script>
<style lang="scss" scoped>
.authorize-item {
  cursor: pointer;
  background-color: rgba(0,0,0,0.12);
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 2.5px;
  overflow: hidden;
  .container {
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    .icon-container {
      display: flex;
      flex-direction: row;
      align-items: center;

      .content {
        opacity: 0.7;
        font-family: $font-semibold;
        letter-spacing: 0.5px;
      }
    }
    .folder-address {
      font-family: $font-semibold;
      color: rgba(255,255,255,0.40);
      letter-spacing: 0.67px;
      line-height: 16px;
    }
  }
}
@keyframes fadein {
  0% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.0) 0%,rgba(255,255,255,0.0) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.0) 23%, rgba(0,0,0,0.0) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  20% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.1) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.04) 23%, rgba(0,0,0,0.04) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  50% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.15) 0%,rgba(255,255,255,0.15) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.08) 23%, rgba(0,0,0,0.08) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  70% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.2) 0%,rgba(255,255,255,0.2) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.1) 23%, rgba(0,0,0,0.1) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  100% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.3) 0%,rgba(255,255,255,0.3) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.14) 23%, rgba(0,0,0,0.14) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
}
@keyframes fadeout {
  100% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.0) 0%,rgba(255,255,255,0.0) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.0) 23%, rgba(0,0,0,0.0) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  70% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.1) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.04) 23%, rgba(0,0,0,0.04) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  50% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.15) 0%,rgba(255,255,255,0.15) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.08) 23%, rgba(0,0,0,0.08) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  20% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.2) 0%,rgba(255,255,255,0.2) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.1) 23%, rgba(0,0,0,0.1) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
  0% {
    background-image: linear-gradient(90deg, rgba(255,255,255,0.3) 0%,rgba(255,255,255,0.3) 100%), radial-gradient(circle at 30% 47%, rgba(255,255,255,0.14) 23%, rgba(0,0,0,0.14) 100%), linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
  }
}
.background-image-in {
  animation: fadein 150ms ease-in-out 1 normal forwards;
}
.background-image-out {
  animation: fadeout 150ms ease-in-out 1 normal forwards;
}
</style>
