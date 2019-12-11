<template>
  <div class="downloadPage">
    <div class="downloadPage--top">
      <div
        v-if="isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'"
        class="titlebar titlebar--mac no-drag"
      >
        <Icon
          :state="state"
          @click.native="handleClose"
          class="titlebar__button"
          type="titleBarClose"
        />
        <Icon
          class="titlebar__button--disable"
          type="titleBarExitFull"
        />
        <Icon
          class="titlebar__button--disable"
          type="titleBarFull"
        />
      </div>
      <div class="title">
        <span>{{ $t('browsing.download.downloadManager') }}</span>
      </div>
      <div
        :style="{
          order: isDarwin ? 2 : 0,
          width: isDarwin ? '74px' : '106px',
          zIndex: 10,
        }"
        class="settings no-drag"
      >
        <Icon
          :style="{
            margin: isDarwin ? 'auto 10px auto 34px' : 'auto auto auto 10px',
          }"
          @click.native="handleSettings"
          @mouseover.native="handleSettingsOver"
          @mouseleave.native="handleSettingsLeave"
          type="downloadSettings"
          class="settings--icon"
        />
        <transition name="fade">
          <div
            ref="settings"
            :style="{
              left: isDarwin ? '' : '10px',
              right: isDarwin ? '10px' : '',
            }"
            v-show="showSettings"
            @blur="handleBlur"
            tabindex="0"
            class="settings--content"
          >
            <div
              :style="{
                marginTop: index === 0 ? '5px' : '',
                marginBottom: index === settingsContent.length - 1 ? '5px' : '',
              }"
              v-for="(i, index) in settingsContent"
              @click="handleGlobalSettings(i.type)"
              class="settings--item"
            >
              <span>{{ $t(i.name) }}</span>
            </div>
          </div>
        </transition>
        <transition name="fade">
          <div
            v-if="showSettings"
            :style="{
              left: isDarwin ? '' : '18px',
              right: isDarwin ? '18px' : '',
            }"
            class="settings--triangle"
          >
            <div class="settings--triangleInner" />
          </div>
        </transition>
      </div>
      <div
        v-if="!isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'"
        class="titlebar titlebar--win no-drag"
      >
        <Icon
          class="titlebar__button--disable"
          type="browsingminimize"
        />
        <Icon
          class="titlebar__button--disable"
          type="browsingfullscreen"
        />
        <Icon
          @click.native="handleClose"
          class="titlebar__button"
          type="browsingclose"
        />
      </div>
    </div>
    <div
      :style="{
        overflowY: needToScroll ? 'scroll' : 'hidden',
      }"
      class="downloadPage--list"
    >
      <div
        v-show="!downloadList.length"
        class="downloadPage--list__none"
      >
        <Icon type="noDownloadList" />
        <span>{{ $t('browsing.download.noHistory') }}</span>
      </div>
      <div
        v-show="downloadList.length"
        v-for="(item, index) in downloadList"
        @mouseover="handleMouseover(index)"
        @mouseleave="handleMouseleave"
        class="downloadPage--item"
      >
        <div class="downloadPage--item__title">
          <div
            :style="{
              width: '350px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }"
          >
            <span
              :style="{
                textDecoration: item.fileRemoved ? 'line-through' : ''
              }"
            >{{ item.name }}</span>
          </div>
          <div
            :style="{
              opacity: hoveredIndex === index && (item.paused || item.size === item.pos) ? '' : '0',
              pointerEvents: hoveredIndex === index && (item.paused || item.size === item.pos)
                ? 'auto' : 'none',
            }"
            @click="clearItem(item)"
            class="clear"
          >
            {{ $t('browsing.download.remove') }}
          </div>
        </div>
        <div class="downloadPage--item__progress">
          <span v-if="(!item.offline || item.pos === item.size) && !item.fileRemoved">
            {{ (item.fileRemoved ? '' : item.pos === item.size
              ? $t('browsing.download.completed') : item.paused ?
                $t('browsing.download.paused') : `${item.speed}/s`) }}&nbsp;{{ '-' }}&nbsp;
          </span>
          <span v-if="(item.offline && item.pos < item.size) && !item.fileRemoved">
            {{ $t('browsing.download.downloadingError') }}
          </span>
          <div
            v-if="!item.offline || item.pos === item.size"
            :style="{
              maxWidth: '280px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              display: 'flex',
            }"
          >
            <span>
              {{ item.fileRemoved ? $t('browsing.download.fileRemoved') : item.size === item.pos
                ? `${item.path}` : `${item.showProgress} of ${item.showSize}` }}
            </span>
          </div>
          <div
            :style="{
              position: 'absolute',
              right: '-25px',
              top: '0',
              width: '17px',
              height: '17px',
            }"
            v-show="item.size === item.pos && !item.fileRemoved"
            @mouseover="handleRevealOver(index)"
            @mouseleave="handleRevealLeave"
          >
            <transition name="fade">
              <Icon
                v-show="revealInFinderHoveredIndex !== index"
                @click.native="handleReveal(item)"
                type="revealInFinder"
              />
            </transition>
            <transition name="fade">
              <Icon
                v-show="revealInFinderHoveredIndex === index"
                @click.native="handleReveal(item)"
                type="revealInFinderHover"
              />
            </transition>
          </div>
        </div>
        <div
          v-show="item.pos < item.size"
          class="downloadPage--item__progressbar"
        >
          <div
            :style="{
              position: 'absolute',
              width: `${item.pos / item.size * 367}px`,
              height: '7px',
              borderRadius: '6px',
              background: item.offline ? '#CFD0DA' : item.paused ? '#FFCA7F' : '#FF9500',
              transition: item.paused ? 'background 100ms linear'
                : 'width 300ms linear, background 100ms linear'
            }"
          />
          <div
            :style="{
              position: 'absolute',
              right: '-25px',
              top: '-5px',
              width: '17px',
              height: '17px'
            }"
            @mouseover="handlePausedHover"
            @mouseleave="handlePausedLeave"
          >
            <transition
              name="fade"
            >
              <Icon
                v-show="!hoveredPausedIcon || hoveredIndex !== index"
                :type="item.paused ? 'downloadResume' : 'downloadPause'"
                @click.native="handleDownloadPause(item)"
              />
            </transition>
            <transition
              name="fade"
            >
              <Icon
                v-show="hoveredPausedIcon && hoveredIndex === index"
                :type="item.paused ? 'downloadResumeHover' : 'downloadPauseHover'"
                @click.native="handleDownloadPause(item)"
              />
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import electron from 'electron';
import fs from 'fs';
import Path from 'path';
import Icon from '@/components/BaseIconContainer.vue';
import BrowsingDownloadManager from '@/services/browsing/BrowsingDownloadManager';
import BrowsingDownload from '@/services/browsing/BrowsingDownload';

export default {
  name: 'DownloadPage',
  components: {
    Icon,
  },
  data() {
    return {
      state: 'default',
      settingsContent: [{ name: 'browsing.download.resumeAll', type: 'resume' }, { name: 'browsing.download.pauseAll', type: 'pause' }, { name: 'browsing.download.clearAll', type: 'clear' }],
      showSettings: false,
      settingsHovered: false,
      downloadList: [],
      hoveredIndex: -1,
      quit: false,
      asyncTasksDone: false,
      needToScroll: false,
      needToRestore: false,
      requestHeaders: {},
      hoveredPausedIcon: false,
      revealInFinderHoveredIndex: -1,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  watch: {
    downloadList(val: {}[]) {
      this.needToScroll = val.length > 5;
    },
  },
  mounted() {
    window.addEventListener('offline', () => {
      this.downloadList.forEach((i: { id: string, name: string, path: string, ext: string,
        url: string, date: number, paused: boolean, offline: boolean, speed: number }) => {
        if (!i.paused) {
          i.offline = true;
          i.speed = 0;
          BrowsingDownloadManager.pauseItem(i.id);
          i.paused = true;
        }
      });
    });
    electron.ipcRenderer.on('file-not-found', (evt: Event, id: string) => {
      const item = this.downloadList.find((i: { id: string, fileRemoved: boolean,
        paused: boolean, pos: number, size: number }) => i.id === id);
      if (item) {
        item.fileRemoved = true;
        item.paused = true;
        item.pos = item.size;
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    electron.ipcRenderer.on('download-headers', (evt: Event, headers: any) => {
      this.requestHeaders = headers;
    });
    electron.ipcRenderer.on('abort-download', async (evt: Event, id: string) => {
      BrowsingDownloadManager.killItemProcess(id);
      this.downloadList = this.downloadList.filter((i: { id: string }) => i.id !== id);
    });
    electron.ipcRenderer.on('downloading-network-error', (evt: Event, id: string) => {
      const errorItem = this.downloadList
        .find((i: { id: string, name: string, path: string, ext: string, url: string,
          date: number, paused: boolean, offline: boolean, speed: number }) => i.id === id);
      if (errorItem && !errorItem.paused) {
        errorItem.offline = true;
        errorItem.speed = 0;
        BrowsingDownloadManager.pauseItem(errorItem.id);
        errorItem.paused = true;
      }
    });
    electron.ipcRenderer.on('quit', (evt: Event, needToRestore?: boolean) => {
      this.quit = true;
      this.needToRestore = !!needToRestore;
    });
    electron.ipcRenderer.on('continue-download-video', (evt: Event, args: { id: string, downloadId: string, name: string, path: string, progress: number, size: number, url: string }[]) => {
      args.forEach((i: {
        id: string, downloadId: string, name: string, path: string,
        progress: number, size: number, url: string,
      }) => {
        const showSize = this.readablizeBytes(i.size, 'MB');
        const pos = i.progress;
        const showProgress = this.readablizeBytes(pos, 'MB');
        const speed = 0;
        const paused = true;
        const isStoredItem = true;
        const offline = !navigator.onLine;
        const fileRemoved = false;
        if (!this.downloadList.map((i: { id: string }) => i.id).includes(i.id)) {
          this.downloadList.push(Object.assign(i, {
            showSize, showProgress, pos, speed, paused, isStoredItem, offline, fileRemoved,
          }));
          BrowsingDownloadManager.addItem(i.id, new BrowsingDownload(i.url, i.id, i.downloadId));
        }
      });
    });
    electron.ipcRenderer.on('download-video', (evt: Event, args: { id: string, name: string, path: string, ext: string, url: string, date: number, time: number }) => {
      if (navigator.onLine) {
        BrowsingDownloadManager.addItem(`${args.url}-${args.id}-${args.time}`, new BrowsingDownload(args.url, `${args.url}-${args.id}-${args.time}`, args.id));
        const defaultName = args.name.endsWith(args.ext) ? args.name : `${args.name}.${args.ext}`;
        if (fs.existsSync(Path.join(args.path, defaultName))) {
          args.name = `${defaultName.slice(0, defaultName.lastIndexOf('.'))}-${args.time}.${args.ext}`;
        } else {
          args.name = defaultName;
        }
        (BrowsingDownloadManager.getAllItems().get(`${args.url}-${args.id}-${args.time}`) as BrowsingDownload)
          .startDownload(args.id, args.name, args.path, this.requestHeaders);
      } else {
        electron.ipcRenderer.send('start-download-error');
      }
    });
    window.onbeforeunload = (e) => {
      if (this.quit) {
        if (!this.asyncTasksDone && !this.needToRestore) {
          e.returnValue = false;
          BrowsingDownloadManager.saveItems();
          this.asyncTasksDone = true;
          electron.remote.app.quit();
        }
      } else {
        e.returnValue = false;
        electron.remote.getCurrentWindow().hide();
      }
    };
    electron.ipcRenderer.on('transfer-download-info', (evt: Event, info: { id: string, downloadId: string, url: string, name: string, path: string, size: number}) => {
      const showSize = this.readablizeBytes(info.size, 'MB');
      const showProgress = '0 MB';
      const pos = 0;
      const speed = 0;
      const paused = false;
      const offline = !navigator.onLine;
      const fileRemoved = false;
      // eslint-disable-next-line no-console
      console.log(info);
      if (!this.downloadList.map((i: { id: string }) => i.id).includes(info.id)) {
        this.downloadList.push(Object.assign(info, {
          showSize, showProgress, pos, speed, paused, offline, fileRemoved,
        }));
        electron.remote.getCurrentWindow().show();
      }
    });
    electron.ipcRenderer.on('transfer-progress', (evt: Event, progress: { id: string, pos: number, speed: number }) => {
      const downloadingItem = this.downloadList
        .find((i: {
          id: string, paused: boolean, pos: number,
          speed: number, showProgress: string, size: number,
        }) => i.id === progress.id);
      if (downloadingItem) {
        if (progress.pos === downloadingItem.size) downloadingItem.paused = true;
        downloadingItem.pos = progress.pos;
        downloadingItem.showProgress = this.readablizeBytes(progress.pos, 'MB');
        downloadingItem.speed = this.readablizeBytes(progress.speed, 'KB');
      }
    });
  },
  methods: {
    handleRevealOver(index: number) {
      this.revealInFinderHoveredIndex = index;
    },
    handleRevealLeave() {
      this.revealInFinderHoveredIndex = -1;
    },
    handleSettingsOver() {
      this.settingsHovered = true;
    },
    handleSettingsLeave() {
      this.settingsHovered = false;
    },
    handlePausedHover() {
      this.hoveredPausedIcon = true;
    },
    handlePausedLeave() {
      this.hoveredPausedIcon = false;
    },
    handleBlur() {
      if (!this.settingsHovered) this.showSettings = false;
    },
    handleReveal(item: { path: string, name: string, fileRemoved: boolean }) {
      if (fs.existsSync(Path.join(item.path, item.name))) {
        electron.shell.showItemInFolder(Path.join(item.path, item.name));
      } else {
        item.fileRemoved = true;
      }
    },
    handleMouseover(index: number) {
      this.hoveredIndex = index;
    },
    handleMouseleave() {
      this.hoveredIndex = -1;
    },
    readablizeBytes(bytes: number, format: string) {
      const powNum = format === 'MB' ? 2 : 1;
      const fixedNum = format === 'MB' ? 2 : 0;
      return `${(bytes / (1024 ** powNum)).toFixed(fixedNum)} ${format}`;
    },
    // Methods to handle window behavior
    handleClose() {
      electron.remote.getCurrentWindow().hide();
    },
    handleSettings() {
      this.showSettings = !this.showSettings;
      this.$nextTick(() => {
        if (this.showSettings) {
          this.$refs.settings.focus();
        }
      });
    },
    handleDownloadPause(item: {
      paused: boolean, id: string, downloadId: string, url: string, name: string, offline: boolean,
      path: string, pos: number, isStoredItem?: boolean, speed: number,
    }) {
      if (item.paused) {
        if (navigator.onLine) {
          if (item.isStoredItem) {
            item.isStoredItem = false;
            BrowsingDownloadManager
              .continueItem(item.id, item.downloadId, item.name, item.path, item.pos);
          } else {
            BrowsingDownloadManager.resumeItem(item.id);
          }
          item.offline = false;
          item.paused = false;
        } else {
          item.offline = true;
        }
      } else {
        item.paused = true;
        item.speed = 0;
        BrowsingDownloadManager.pauseItem(item.id);
      }
    },
    handleGlobalSettings(type: string) {
      this.showSettings = false;
      const clearItems = this.downloadList
        .filter((i: { pos: number, size: number, id: string }) => i.pos === i.size);
      switch (type) {
        case 'pause':
          this.downloadList.forEach((i: { paused: boolean }) => {
            i.paused = true;
          });
          BrowsingDownloadManager.pauseAllItems();
          break;
        case 'resume':
          this.downloadList.forEach((i: {
            paused: boolean, id: string, url: string, name: string, offline: boolean,
            path: string, pos: number, isStoredItem?: boolean, speed: number,
          }) => {
            if (!i.offline && i.paused) this.handleDownloadPause(i);
          });
          break;
        case 'clear':
          BrowsingDownloadManager.abortAllItems(clearItems.map((i: { id: string}) => i.id));
          this.downloadList = this.downloadList
            .filter((i: { pos: number, size: number }) => i.pos !== i.size);
          break;
        default:
          break;
      }
    },
    async clearItem(item: { id: string, pos: number, size: number, path: string, name: string }) {
      await BrowsingDownloadManager.abortItem(item.id);
      this.downloadList = this.downloadList.filter((i: { id: string }) => i.id !== item.id);
      if (item.pos < item.size) {
        if (fs.existsSync(Path.join(item.path, item.name))) {
          fs.unlink(Path.join(item.path, item.name), (err) => {
            if (err) throw err;
          });
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.downloadPage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  &--top {
    width: 100%;
    height: 40px;
    display: flex;
    border-bottom: 1px solid #F2F1F4;
    -webkit-app-region: drag;
    .titlebar--content {
      width: auto;
      height: 100%;
    }
    .title {
      height: 100%;
      display: flex;
      flex: 1;
      order: 1;
      span {
        margin: auto;
        font-size: 12px;
        color: #6F7078;
      }
    }
    .settings {
      width: 74px;
      height: 100%;
      display: flex;
      &--icon {
        transition: background-color 100ms linear;
        border-radius: 100%;
        &:hover {
          background-color: #F5F6F8;
        }
      }
      &--content {
        width: 130px;
        height: 100px;
        position: absolute;
        top: 44px;
        background: #FFFFFF;
        border: 1px solid #F1F0F3;
        box-shadow: 0 2px 7px rgba(0, 0, 0, 0.05);
        border-radius: 2px;
        display: flex;
        flex-direction: column;
        outline: none;
      }
      &--item {
        width: 100%;
        height: 37px;
        display: flex;
        &:hover {
          background: #F5F6F8;
        }
        span {
          margin: auto;
          font-size: 12px;
          color: #747282;
        }
      }
      &--triangle{
        margin: 0;
        border-width: 6px;
        border-style: solid;
        border-color: transparent transparent #F1F0F3 transparent;
        padding: 0;
        width: 0;
        height: 0;
        top: 32px;
        position: absolute;
      }
      &--triangleInner{
        margin: 0;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent #FFFFFF transparent;
        padding: 0;
        width: 0;
        height: 0;
        right: -5px;
        top: -3px;
        position: absolute;
      }
    }
  }
  .titlebar {
    display: flex;
    flex-wrap: nowrap;

    &--mac {
      margin: 12px auto 17px 14px;
      width: fit-content;

      .titlebar__button {
        margin-right: 8px;
        width: 12px;
        height: 12px;
        background-repeat: no-repeat;
        -webkit-app-region: no-drag;
        border-radius: 100%;

        &--disable {
          pointer-events: none;
          opacity: 0.25;
        }
      }
    }

    &--win {
      width: 106px;
      height: 100%;
      z-index: 2;
      order: 3;

      .titlebar__button {
        width: 30px;
        height: 100%;
        background-color: rgba(255, 255, 255, 0);
        transition: background-color 200ms;

        &--disable {
          pointer-events: none;
          opacity: 0.25;
          width: 30px;
          height: 100%;
          margin-right: 4px;
        }

        &:hover {
          background-color: rgba(221, 221, 221, 0.2);
        }

        &:active {
          background-color: rgba(221, 221, 221, 0.5);
        }
      }
    }
  }
  &--list {
    width: 100%;
    height: 459px;
  }
  &--list__none {
    width: auto;
    height: auto;
    position: absolute;
    left: 50%;
    top: 115px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    span {
      margin: 5px auto auto auto;
      font-size: 12px;
      color: #ACADB7;
    }
  }
  &--item {
    width: calc(100% - 30px);
    margin: 0 15px;
    height: 84px;
    border-bottom: 1px solid #F1F0F3;
    display: flex;
    flex-direction: column;
  }
  &--item__title {
    margin: 18px auto 5px 20px;
    width: 400px;
    height: 18px;
    line-height: 18px;
    display: flex;
    justify-content: space-between;
    span {
      font-size: 13px;
      color: #717382
    }
    .clear {
      width: 35px;
      text-align: center;
      font-size: 12px;
      color: #616372;
      opacity: 0.5;
      transition: opacity 100ms linear;
      &:hover {
        opacity: 1;
      }
    }
  }
  &--item__progress {
    margin: 0 auto 4px 20px;
    width: auto;
    line-height: 16px;
    height: 16px;
    position: relative;
    display: flex;
    span {
      font-size: 12px;
      color: #717382;
      opacity: 0.5;
    }
  }
  &--item__progressbar {
    margin: 0 auto auto 20px;
    width: 367px;
    height: 7px;
    border-radius: 6px;
    background: rgba(207, 208, 218, 0.5);
    position: relative;
  }
}
.fade-enter-active, .fade-leave-active {
   transition: opacity .1s linear;
 }
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
