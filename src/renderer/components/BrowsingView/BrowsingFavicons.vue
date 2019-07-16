<template>
  <div
    :style="{ left: isDarwin ? '' : '15px', right: isDarwin ? '10px' : '' }"
    class="fav-icons"
  >
    <div
      ref="favDetail"
      :class="favAnimClass"
      @animationend="handleFavAnimEnd"
      :style="{ order: isDarwin ? '1' : '2' }"
      class="fav-icons-details"
    >
      <div
        v-for="(item, index) in favicon"
        @mouseover="favIconMouseOver(index)"
        @mouseleave="favIconMouseLeave"
        @mouseup="handleFavOpen(item)"
        :style="{
          margin: isDarwin ? 'auto 0 auto 15px' : 'auto 15px auto 0'
        }"
        class="fav-icon-container"
      >
        <Icon
          :type="item.type"
          :style="{ opacity: index === faviconIndex ? '1' : 'calc(4 / 9)'}"
        />
      </div>
    </div>
    <Icon
      @mouseup.native="handleShowFavicon"
      :style="{
        order: isDarwin ? '2' : '1', margin: isDarwin ? 'auto 0 auto 10px' : 'auto 10px auto 0',
        transform: `rotate(${rotateNum}deg)`,
        transition: 'transform 100ms linear' }"
      type="showFavicon"
      class="fav-display"
    />
  </div>
</template>

<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingFavicons',
  components: {
    Icon,
  },
  props: {
    recordUrl: {
      type: Object,
      required: true,
    },
    updateInitialUrl: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      showFavicon: true,
      favicon: [
        { name: '爱奇艺', type: 'iqiyi', url: 'https://www.iqiyi.com' },
        { name: 'Bilibili', type: 'bilibili', url: 'https://www.bilibili.com' },
        { name: 'YouTube', type: 'youtube', url: 'https://www.youtube.com' },
      ],
      faviconIndex: -1,
    };
  },
  computed: {
    favAnimClass() {
      if (this.isDarwin) {
        return this.showFavicon ? 'fav-show-animation' : 'fav-hide-animation';
      }
      return this.showFavicon ? 'win-fav-show-animation' : 'win-fav-hide-animation';
    },
    isDarwin() {
      return process.platform === 'darwin';
    },
    rotateNum() {
      if (this.isDarwin) {
        return this.showFavicon ? '180' : '0';
      }
      return this.showFavicon ? '0' : '180';
    },
  },
  methods: {
    favIconMouseOver(index: number) {
      this.faviconIndex = index;
    },
    favIconMouseLeave() {
      this.faviconIndex = -1;
    },
    handleShowFavicon() {
      if (!this.showFavicon) {
        this.$refs.favDetail.style.display = 'flex';
      }
      this.showFavicon = !this.showFavicon;
    },
    handleFavOpen(item: { name: string, type: string, url: string }) {
      this.updateInitialUrl(this.recordUrl[item.type] ? this.recordUrl[item.type] : item.url);
    },
    handleFavAnimEnd(e: AnimationEvent) {
      const target = e.target as HTMLElement;
      if (target.classList.contains('fav-hide-animation') || target.classList.contains('win-fav-hide-animation')) {
        this.$refs.favDetail.style.display = 'none';
      }
    },
  },
};
</script>

<style scoped lang="scss">
.fav-icons {
  width: auto;
  display: flex;
  height: 20px;
  position: absolute;
  top: 8px;
  z-index: 6;
  .fav-icons-details {
    width: auto;
    height: 20px;
    display: flex;
    .fav-icon-container {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }
  .fav-display {
    width: 10px;
    height: 10px;
    cursor: pointer;
  }
}
.fav-show-animation {
  animation: fav-show 100ms linear 1 normal forwards;
}
.fav-hide-animation {
  animation: fav-hide 100ms linear 1 normal forwards;
}
@keyframes fav-show {
  0% { transform: translateX(10px); opacity: 0 }
  50% { transform: translateX(5px); opacity: 0.5 }
  100% { transform: translateX(0); opacity: 1 }
}
@keyframes fav-hide {
  0% { transform: translateX(0); opacity: 1 }
  50% { transform: translateX(5px); opacity: 0.5 }
  100% { transform: translateX(10px); opacity: 0 }
}
.win-fav-show-animation {
  animation: win-fav-show 100ms linear 1 normal forwards;
}
.win-fav-hide-animation {
  animation: win-fav-hide 100ms linear 1 normal forwards;
}
@keyframes win-fav-show {
  0% { transform: translateX(-10px); opacity: 0 }
  50% { transform: translateX(-5px); opacity: 0.5 }
  100% { transform: translateX(0); opacity: 1 }
}
@keyframes win-fav-hide {
  0% { transform: translateX(0); opacity: 1 }
  50% { transform: translateX(-5px); opacity: 0.5 }
  100% { transform: translateX(-10px); opacity: 0 }
}
</style>
