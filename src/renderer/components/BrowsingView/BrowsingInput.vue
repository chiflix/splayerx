<template>
  <div
    :style="{
      width: isDarwin ? 'calc(100% - 176px)' : 'calc(100% - 290px)',
    }"
    class="search-url"
  >
    <div
      v-if="!isMas"
      :style="{
        borderRadius: '3px',
        position: 'relative',
      }"
      @mouseover="handleDownloadMouseover"
      @mouseleave="handleDownloadMouseleave"
      @dblclick.self.stop="handleDblclick"
      class="video-download"
    >
      <div
        :style="{
          width: '23px',
          height: '23px',
          pointerEvents: isWebPage ? 'auto' : 'none',
          opacity: isWebPage ? '' : '0.35'
        }"
        class="fetch-video"
      >
        <Icon
          v-show="!gotDownloadInfo"
          @click.native="getDownloadVideo"
          type="download"
        />
      </div>
      <transition
        name="fade"
      >
        <Icon
          v-show="!gotDownloadInfo && downloadHovered"
          @click.native="openDownloadList"
          type="downloadList"
        />
      </transition>
      <transition
        name="fade"
      >
        <div
          v-show="gotDownloadInfo"
          :style="{
            width: '23px',
            height: '23px',
            display: 'flex',
            borderRadius: '3px',
            background: 'rgba(126, 128, 143, 0.4)',
            position: 'absolute',
            top: '8.5px',
            left: '8px',
          }"
        >
          <div
            class="loading-content"
          >
            <div
              v-for="(item, index) in new Array(3)"
              :style="{
                background: index === loadingIndex ?
                  'rgba(137, 139, 153, 0.35)' : 'rgba(126, 128, 143, 0.8)',
              }"
              class="loading"
            />
          </div>
        </div>
      </transition>
    </div>
    <div
      :style="{
        order: isDarwin ? 1 : 2,
        width: 'calc(100% - 87px)',
      }"
      @dblclick="handleDblclick"
      class="url-search"
    >
      <transition
        name="fade-200"
        mode="out-in"
      >
        <div
          key="downloadLimited"
          v-if="downloadErrorCode"
          class="content"
        >
          <Icon type="getDownloadError" />
          <span
            :style="{
              color: '#FA6400'
            }"
            class="title"
          >
            {{ downloadErrorCode === 'limited' ? $t('browsing.download.sitesLimited')
              : downloadErrorCode === 'No Resources' ? $t('browsing.download.noResources')
                : $t('browsing.download.unknownError') }}</span>
        </div>
        <div
          v-else-if="!copied"
          class="content"
        >
          <button
            :title="$t('browsing.copyUrlTitle')"
            v-if="isWebPage && !gettingTemporaryViewInfo"
            @click="onCopy"
            class="btn"
          >
            <Icon
              class="icon"
              type="copyUrl"
            />
          </button>
          <span class="title">{{ gettingTemporaryViewInfo
            ? $t('browsing.download.loading') : title }}</span>
        </div>
        <div
          key="success"
          v-else
          class="content"
        >
          <span class="title">{{ $t('browsing.copied') }}</span>
        </div>
      </transition>
    </div>
    <div
      :style="{
        order: isDarwin ? 2 : -1,
        borderRight: isDarwin ? '' : '1px solid #F2F1F4'
      }"
      @dblclick.self="handleDblclick"
      class="control-button"
    >
      <div
        :class="canReload ? 'control-button-hover' : ''"
        @mouseup="handleUrlReload"
        class="page-refresh-icon no-drag"
      >
        <Icon
          :type="!canReload ? 'pageRefreshDisabled' : isLoading ? 'reloadStop' : 'pageRefresh'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingInput',
  components: {
    Icon,
  },
  props: {
    isWebPage: {
      type: Boolean,
      default: false,
    },
    currentUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'SPlayer',
    },
    isLoading: {
      type: Boolean,
      required: true,
    },
    handleUrlReload: {
      type: Function,
      required: true,
    },
    canReload: {
      type: Boolean,
      default: true,
    },
    gotDownloadInfo: {
      type: Boolean,
      required: true,
    },
    getDownloadVideo: {
      type: Function,
      required: true,
    },
    downloadErrorCode: {
      type: String,
      default: '',
    },
    handleDblclick: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      copied: false,
      loadingIndex: 0,
      timer: 0,
      downloadHovered: false,
    };
  },
  computed: {
    ...mapGetters(['gettingTemporaryViewInfo']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    isMas() {
      return process.mas;
    },
  },
  watch: {
    gotDownloadInfo(val: boolean) {
      if (val) {
        this.timer = setInterval(() => {
          this.loadingIndex = this.loadingIndex < 2 ? this.loadingIndex + 1 : 0;
        }, 200);
      } else {
        clearTimeout(this.timer);
        this.loadingIndex = 0;
      }
    },
  },
  methods: {
    openDownloadList() {
      this.$electron.ipcRenderer.send('open-download-list');
    },
    handleDownloadMouseover() {
      this.downloadHovered = true;
    },
    handleDownloadMouseleave() {
      this.downloadHovered = false;
    },
    onCopy() {
      this.$electron.clipboard.writeText(this.currentUrl);
      this.copied = true;
      if (this.copiedTimeoutId) clearTimeout(this.copiedTimeoutId);
      this.copiedTimeoutId = setTimeout(() => {
        this.copied = false;
      }, 1500);
    },
  },
};
</script>

<style scoped lang="scss">
::-webkit-input-placeholder {
  color: rgba(255, 255, 255, 0.47);
}
::selection {
  background-color: rgba(255, 255, 255, 0.2);
}
.search-url {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 40px;
  z-index: 6;
  .video-download {
    width: 33px;
    height: 100%;
    padding-left: 8px;
    display: flex;
    transition: background-color 100ms linear;
    -webkit-app-region: no-drag;
    .fetch-video {
      margin: auto 0;
      border-radius: 3px;
      transition: background-color 100ms linear;
      &:hover {
        background-color: #F1F2F5;
      }
      &:active {
        background-color: #C7C8CE;
      }
    }
    .loading-content{
      width: 15px;
      height: 3px;
      margin: auto;
      display: flex;
      justify-content: space-between;
      .loading {
        width: 3px;
        height: 3px;
        border-radius: 100%;
        transition: background-color 200ms linear;
      }
    }
  }
  .url-search {
    outline: none;
    background-color: #FFF;
    border: none;
    z-index: 6;

    .content {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .btn {
      height: 38px;
      outline: none;
      border-width: 0;
      -webkit-app-region: no-drag;
    }
    .title {
      font-size: 12px;
      color: #7E808E;
      letter-spacing: 0.09px;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .icon {
      display: block;
      width: 20px;
      height: 40px;
      opacity: 0.5;
      transition: opacity 100ms linear;
      &:hover {
        opacity: 1.0;
      }
      &-success {
        display: block;
        width: 20px;
        height: 38px;
      }
      &-nike {
        display: block;
        margin-left: 2px;
        width: 14px;
        height: 38px;
      }
    }
  }
  .control-button {
    width: 46px;
    height: 40px;
    display: flex;
  }
  .control-button-hover:hover {
    background-color: #ECEEF0;
  }
  .page-refresh-icon {
    width: 30px;
    height: 30px;
    border-radius: 100%;
    margin: auto;
    transition: background-color 100ms ease-in;
    justify-content: center;
    align-items: center;
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .1s linear;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
