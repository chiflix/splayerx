<template>
  <div class="fav-icons" :style="{ left: isDarwin ? '' : '10px', right: isDarwin ? '10px' : '' }">
    <div class="fav-icons-details" v-show="showFavicon" :style="{ order: isDarwin ? '1' : '2' }">
      <div class="fav-icon-container" v-for="(item, index) in favicon" @mouseover="favIconMouseOver(index)" @mouseleave="favIconMouseLeave">
        <Icon :type="item" :style="{ opacity: index === faviconIndex ? '1' : 'calc(4 / 9)'}"></Icon>
      </div>
    </div>
    <Icon :type="showFavType" class="fav-display" @mouseup.native="handleShowFavicon" :style="{
      order: isDarwin ? '2' : '1', margin: isDarwin ? 'auto 0 auto 10px' : 'auto 0 auto 0' }"></Icon>
  </div>
</template>

<script>
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'BrowsingFavicons',
  data() {
    return {
      showFavicon: false,
      favicon: ['youku', 'bilibili', 'youtube'],
      faviconIndex: -1,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    showFavType() {
      if (this.isDarwin) {
        return this.showFavicon ? 'hideFavicon' : 'showFavicon';
      }
      return this.showFavicon ? 'showFavicon' : 'hideFavicon';
    },
  },
  components: {
    Icon,
  },
  methods: {
    favIconMouseOver(index) {
      this.faviconIndex = index;
    },
    favIconMouseLeave() {
      this.faviconIndex = -1;
    },
    handleShowFavicon() {
      this.showFavicon = !this.showFavicon;
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
  .fav-icons-details {
    width: auto;
    height: 20px;
    display: flex;
    .fav-icon-container {
      width: 20px;
      height: 20px;
      margin-left: 10px;
    }
  }
  .fav-display {
    width: 10px;
    height: 10px;
  }
}
</style>
