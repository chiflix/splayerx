<template>
  <div class="browsing-control">
    <Icon :type="backType" ref="back" class="back-icon" @mouseup.native="handleUrlBack"></Icon>
    <Icon :type="forwardType" ref="forward" class="forward-icon" @mouseup.native="handleUrlForward"></Icon>
    <Icon type="pageRefresh" class="page-refresh-icon" @mouseup.native="handleUrlReload"></Icon>
    <Icon type="videoRecordDisabled" class="video-record-icon"></Icon>
    <Icon type="pipDisabled" class="pic-in-pic"></Icon>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'BrowsingControl',
  data() {
    return {
      backType: 'back',
      forwardType: 'forward',
    };
  },
  computed: {
    ...mapGetters(['winWidth']),
  },
  watch: {
    backType(val) {
      if (val === 'back') {
        this.$refs.back.$el.classList.add('able-opacity');
      } else {
        this.$refs.back.$el.classList.remove('able-opacity');
      }
    },
    forwardType(val) {
      if (val === 'forward') {
        this.$refs.forward.$el.classList.add('able-opacity');
      } else {
        this.$refs.back.$el.classList.remove('able-opacity');
      }
    },
  },
  mounted() {
    this.$bus.$on('web-info', (info) => {
      this.url = info.url;
      this.backType = info.canGoBack ? 'back' : 'backDisabled';
      this.forwardType = info.canGoForward ? 'forward' : 'forwardDisabled';
    });
  },
  components: {
    Icon,
  },
  methods: {
    handleUrlReload() {
      this.$bus.$emit('url-reload');
    },
    handleUrlBack() {
      this.$bus.$emit('url-back');
    },
    handleUrlForward() {
      this.$bus.$emit('url-forward');
    },
  },
};
</script>

<style scoped lang="scss">
.browsing-control {
  position: absolute;
  width: 245px;
  height: 70px;
  display: flex;
  border-radius: 13px;
  background: rgba(0, 0, 0, 0.73);
  backdrop-filter: blur(10px);
  clip-path: inset(0 round 13px);
  bottom: 35px;
  left: 50%;
  transform: translateX(-50%);
  .back-icon {
    width: 24px;
    height: 32px;
    margin: auto 0 auto 20px;
    cursor: pointer;
  }
  .forward-icon {
    width: 24px;
    height: 32px;
    margin: auto 0 auto 15px;
    cursor: pointer;
  }
  .able-opacity:active {
    opacity: 0.5;
  }
  .page-refresh-icon, .video-record-icon, .pic-in-pic {
    width: 32px;
    height: 32px;
    margin: auto 0 auto 15px;
    cursor: pointer;
  }
}
</style>
