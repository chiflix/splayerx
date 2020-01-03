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
          :state="state"
          @click.native="handleMinimize"
          class="titlebar__button"
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
          width: isDarwin ? '74px' : '114px',
          zIndex: 10,
        }"
        class="settings no-drag"
      >
        <Icon
          :style="{
            margin: isDarwin ? 'auto 10px auto 34px' : 'auto auto auto 10px',
            background: settingsHovered || showSettings ? isDarkMode ? '#54545A' : '#F5F6F8' : ''
          }"
          @click.native="handleSettings"
          @mouseover.native="handleSettingsOver"
          @mouseleave.native="handleSettingsLeave"
          :type="isDarkMode ? showSettings
            ? 'downloadShowSettingsDark' : 'downloadSettingsDark' : 'downloadSettings'"
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
        <div
          :style="{
            margin: 'auto 4px auto 8px'
          }"
          class="control-buttons"
        >
          <Icon
            @click.native="handleMinimize"
            class="titlebar__button"
            type="browsingminimize"
          />
        </div>
        <div
          :style="{
            margin: 'auto 4px auto 0'
          }"
          class="control-buttons"
        >
          <Icon
            class="titlebar__button--disable"
            type="browsingfullscreen"
          />
        </div>
        <div
          :style="{
            margin: 'auto 8px auto 0'
          }"
          class="control-buttons"
        >
          <Icon
            @click.native="handleClose"
            class="titlebar__button"
            type="browsingclose"
          />
        </div>
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
        <Icon :type="isDarkMode ? 'noDownloadListDark' : 'noDownloadList'" />
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
              width: '340px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '13px',
              color: '#717382',
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
              fontSize: '12px',
              color: '#717382',
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
                :type="isDarkMode ? 'revealInFinderDark' : 'revealInFinder'"
              />
            </transition>
            <transition name="fade">
              <Icon
                v-show="revealInFinderHoveredIndex === index"
                @click.native="handleReveal(item)"
                :type="isDarkMode ? 'revealInFinderHoverDark' : 'revealInFinderHover'"
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
              background: progressBarColor(item.offline, item.paused),
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
                :type="controlBtnDefault(item.paused)"
                @click.native="handleDownloadPause(item)"
              />
            </transition>
            <transition
              name="fade"
            >
              <Icon
                v-show="hoveredPausedIcon && hoveredIndex === index"
                :type="controlBtnHovered(item.paused)"
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
      isDarkMode: false,
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
    this.isDarkMode = electron.remote.nativeTheme.shouldUseDarkColors;
    electron.remote.nativeTheme.on('updated', () => {
      this.isDarkMode = electron.remote.nativeTheme.shouldUseDarkColors;
    });
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
        downloadingItem.speed = this.readablizeBytes(progress.speed, progress.speed >= 1024 ** 2 ? 'MB' : 'KB');
      }
    });
  },
  methods: {
    controlBtnDefault(paused: boolean) {
      if (this.isDarkMode) return paused ? 'downloadResumeDark' : 'downloadPauseDark';
      return paused ? 'downloadResume' : 'downloadPause';
    },
    controlBtnHovered(paused: boolean) {
      if (this.isDarkMode) return paused ? 'downloadResumeHoverDark' : 'downloadPauseHoverDark';
      return paused ? 'downloadResumeHover' : 'downloadPauseHover';
    },
    progressBarColor(offline: boolean, paused: boolean) {
      if (this.isDarkMode) {
        if (offline) return '#2D2D31';
        if (paused) return '#606066';
        return 'rgba(255, 255, 255, 0.7)';
      }
      if (offline) return '#CFD0DA';
      if (paused) return '#FFCA7F';
      return '#FF9500';
    },
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
    handleMinimize() {
      electron.remote.getCurrentWindow().minimize();
    },
    handleClose() {
      if (electron.remote.BrowserWindow.getAllWindows().length === 1 && !this.isDarwin) {
        electron.remote.app.quit();
      } else {
        electron.remote.getCurrentWindow().hide();
      }
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
            paused: boolean, id: string, url: string, name: string,
            offline: boolean, path: string, pos: number, isStoredItem?: boolean, speed: number,
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

<style scoped lang="scss" src="../css/darkmode/DownloadPage.scss"></style>
