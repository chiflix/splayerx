<template>
  <div
    :style="{
      width: isDarwin ? 'calc(100% - 176px)' : 'calc(100% - 290px)',
    }"
    class="search-url"
  >
    <div
      :style="{
        order: isDarwin ? 1 : 2,
      }"
      class="url-search"
    >
      <transition name="fade" mode="out-in">
        <div class="content" v-if="!copied">
          <button
            ref="btn"
            class="btn"
          >
            <Icon
              class="icon"
              type="copyUrl"
            />
          </button>
          <span>{{ title }}</span>
        </div>
        <div class="content" v-else>
          <Icon class="icon" type="copyUrl" />
          <span>{{ 'Copy Done' }}</span> 
          <Icon class="icon" type="successBlack" />
        </div>
      </transition>
    </div>
    <div
      @mouseup="handleUrlReload"
      :style="{
        order: isDarwin ? 2 : 1,
      }"
      :class="canReload ? 'control-button-hover' : ''"
      class="control-button page-refresh-icon no-drag"
    >
      <Icon
        :type="!canReload ? 'pageRefreshDisabled' : isLoading ? 'reloadStop' : 'pageRefresh'"
      />
    </div>
  </div>
</template>

<script lang="ts">
import ClipBoardJS from 'clipboard';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingInput',
  components: {
    Icon,
  },
  props: {
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
    closeUrlInput: {
      type: Function,
      required: true,
    },
    playFileWithPlayingView: {
      type: Function,
      required: true,
    },
    canReload: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      copied: false,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  mounted() {
    const clipboard = new ClipBoardJS(
      '.btn',
      {
        text: () => this.title,
        action: () => 'copy',
      },
    );
    clipboard.on('success', this.onCopy);
  },
  methods: {
    handleCloseUrlInput() {
      this.closeUrlInput();
    },
    onCopy() {
      console.log('success');
      this.copied = true;
      if (this.copiedTimeoutId) clearTimeout(this.copiedTimeoutId);
      this.copiedTimeoutId = setTimeout(() => {
        this.copied = false;
      }, 400);
    },
    handleSearchKey(e: KeyboardEvent) {
      const inputUrl = this.$refs.searchValue.value;
      if (e.key === 'Enter') {
        this.playFileWithPlayingView(inputUrl);
      }
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
.fade {
  &-enter, &-leave-to {
    opacity: 0;
  }
  &-enter-active, &-leave-active {
    transition: opacity 100ms ease-out;
  }
}
.search-url {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 40px;
  z-index: 6;
  .url-search {
    width: 100%;
    margin-left: 8px;
    outline: none;
    background-color: #FFF;
    border: none;
    z-index: 6;

    font-size: 12px;
    color: #7E808E;
    letter-spacing: 0.09px;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    .content {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .btn {
      outline: none;
      border-width: 0;
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
    }
  }
  .control-button {
    width: 30px;
    height: 30px;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 100ms ease-in;
  }
  .control-button-hover:hover {
    background-color: #ECEEF0;
  }
  .page-refresh-icon {
    margin-right: 8px;
    margin-left: 8px;
  }
}
</style>
