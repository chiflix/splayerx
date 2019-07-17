<template>
  <div class="browsing-control">
    <Icon
      ref="back"
      :type="backType"
      :style="{
        cursor: webInfo.canGoBack ? 'pointer' : ''
      }"
      @mouseup.native="handleUrlBack"
      class="back-icon"
    />
    <Icon
      ref="forward"
      :type="forwardType"
      :style="{
        cursor: webInfo.canGoForward ? 'pointer' : ''
      }"
      @mouseup.native="handleUrlForward"
      class="forward-icon"
    />
    <Icon
      @mouseup.native="handleUrlReload"
      :style="{
        cursor: 'pointer',
      }"
      type="pageRefresh"
      class="page-refresh-icon"
    />
    <Icon
      type="videoRecordDisabled"
      class="video-record-icon"
    />
    <Icon
      :type="picInPicType"
      :style="{
        cursor: webInfo.hasVideo ? 'pointer' : ''
      }"
      @mouseup.native="handleEnterPip"
      class="pic-in-pic"
    />
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingControl',
  components: {
    Icon,
  },
  props: {
    handleEnterPip: {
      type: Function,
      required: true,
    },
    handleUrlReload: {
      type: Function,
      required: true,
    },
    handleUrlBack: {
      type: Function,
      required: true,
    },
    handleUrlForward: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      backType: 'backDisabled',
      forwardType: 'forwardDisabled',
      webInfo: {},
    };
  },
  computed: {
    ...mapGetters(['winWidth']),
    picInPicType() {
      return this.webInfo.hasVideo ? 'pip' : 'pipDisabled';
    },
  },
  watch: {
    backType(val: string) {
      if (val === 'back') {
        this.$refs.back.$el.classList.add('able-opacity');
      } else {
        this.$refs.back.$el.classList.remove('able-opacity');
      }
    },
    forwardType(val: string) {
      if (val === 'forward') {
        this.$refs.forward.$el.classList.add('able-opacity');
      } else {
        this.$refs.forward.$el.classList.remove('able-opacity');
      }
    },
  },
  methods: {
    updateWebInfo(info: {
      hasVideo: boolean, url: string, canGoBack: boolean, canGoForward: boolean
    }) {
      this.webInfo = info;
      this.backType = info.canGoBack ? 'back' : 'backDisabled';
      this.forwardType = info.canGoForward ? 'forward' : 'forwardDisabled';
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
  .back-icon {
    width: 24px;
    height: 32px;
    margin: auto 0 auto 20px;
  }
  .forward-icon {
    width: 24px;
    height: 32px;
    margin: auto 0 auto 15px;
  }
  .able-opacity:active {
    opacity: 0.5;
  }
  .page-refresh-icon:active {
    opacity: 0.5;
  }
  .page-refresh-icon, .video-record-icon, .pic-in-pic {
    width: 32px;
    height: 32px;
    margin: auto 0 auto 15px;
  }
}
</style>
