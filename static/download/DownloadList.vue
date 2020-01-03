<template>
  <div class="mask">
    <div
      :style="{
        background: isDarkMode ? '#434348' : '#FFFFFF',
        border: isDarkMode ? '1px solid #606066' : '1px solid #F2F2F2'
      }"
      class="list-container"
    >
      <div class="list-items">
        <div class="file-name">
          <span>{{ $t('browsing.download.fileName') }}</span>
          <div
            :class="isDarkMode ? 'file-input-dark' : 'file-input-light'"
            class="file-input"
          >
            <input
              ref="inputFileName"
              v-model="selectedName"
              :maxlength="fileNameMaxLength"
              class="name-content"
            >
          </div>
        </div>
        <div class="definition">
          <span>{{ $t('browsing.download.resolution') }}</span>
          <div
            :style="{
              background: selectedItemBackground,
              borderColor: selectedItemBorderColor,
              borderWidth: showDetailList ? '1px 1px 0 1px' : '1px 1px 1px 1px',
              borderRadius: showDetailList ? '2px 2px 0 0' : '2px'
            }"
            @click="handleShowDetails"
            @mouseover="handleSelectedOver"
            @mouseleave="handleSelectedLeave"
            class="selected-item"
          >
            <span
              :style="{
                opacity: selectedUnavailable ? '0.4' : '',
              }"
            >{{ selectedItem.definition }}</span>
            <Icon
              v-show="parseInt(selectedItem.definition, 10) > 480"
              :type="selectedUnavailable ? 'vipDownload': isDarkMode
                ? 'vipDownloadAvailableDark' : 'vipDownloadAvailable'"
              class="vip-marks"
            />
            <Icon
              :style="{
                opacity: showDetailList || selectedHovered ? 1 : 0.35
              }"
              :type="isDarkMode ? 'definitionMoreDark' : 'definitionMore'"
            />
          </div>
          <transition name="fade">
            <div
              ref="downloadList"
              v-show="showDetailList"
              @blur="handleBlur"
              :class="isDarkMode ? 'definition-content-dark' : 'definition-content-light'"
              class="definition-content"
              tabindex="1"
            >
              <div class="scroll-content">
                <div
                  :style="{
                    pointerEvents: isVip || parseInt(item.definition, 10) <= 480
                      || isNaN(parseInt(item.definition, 10)) ? 'auto' : 'none'
                  }"
                  v-for="(item) in downloadList"
                  @click="handleSelectedItem(item)"
                  class="definition-item"
                >
                  <span
                    :style="{
                      opacity: isVip || parseInt(item.definition, 10) <= 480
                        || isNaN(parseInt(item.definition, 10)) ? 1 : 0.4,
                    }"
                  >{{ item.definition }}</span>
                  <Icon
                    v-show="parseInt(item.definition, 10) > 480"
                    :type="isVip ? isDarkMode
                      ? 'vipDownloadAvailableDark' : 'vipDownloadAvailable' : 'vipDownload'"
                  />
                </div>
              </div>
            </div>
          </transition>
        </div>
        <div class="save-folder">
          <span>{{ $t('browsing.download.saveTo') }}</span>
          <div
            :style="{
              borderColor: folderBorderColor,
              background: folderBackground,
            }"
            @click="selectSavedPath"
            @mouseover="handleDialogOver"
            @mouseleave="handleDialogLeave"
            :class="isDarkMode ? 'folder-content-dark' : 'folder-content-light'"
            class="folder-content"
          >
            <span
              :style="{
                color: pathInitInMas ? '#CDD3DE' : '',
              }"
            >{{ path }}</span>
            <Icon
              :style="{
                opacity: dialogOpened || dialogHovered ? 1 : 0.35,
                transition: 'opacity 100ms linear'
              }"
              :type="isDarkMode ? 'fileSaveSelectedDark' : 'fileSaveSelected'"
            ></Icon>
          </div>
        </div>
        <div class="bottom-btns">
          <button
            @click="handleCancel"
            :class="isDarkMode ? 'cancel-dark' : 'cancel-light'"
            class="cancel"
          >
            {{ $t('browsing.download.cancel') }}
          </button>
          <button
            @click="handleDownload"
            :style="{
              opacity: (!selectedName || downloadLimited
                || pathInitInMas || selectedUnavailable) && !isDarkMode ? '0.5' : '',
              border: downloadBtnBorderColor,
              background: downloadBtnBackground,
              color: (!selectedName || downloadLimited || pathInitInMas
                || selectedUnavailable) && isDarkMode ? 'rgba(255, 255, 255, 0.25)' : '',
              pointerEvents: !selectedName || downloadLoading || selectedUnavailable
                || downloadLimited || pathInitInMas ? 'none' : 'auto',
            }"
            :class="isDarkMode ? 'download-dark' : 'download-light'"
            class="download"
          >
            {{ downloadLoading ? $t('browsing.download.loading')
              : downloadLimited ? $t('browsing.download.limited')
                : $t('browsing.download.submit') }}
          </button>
        </div>
      </div>
      <div
        v-show="!isVip || downloadError || fileNameInvalid"
        :style="{
          pointerEvents: downloadError ? 'none' : 'auto'
        }"
        :class="isDarkMode ? 'footer-dark' : 'footer-light'"
        class="footer"
      >
        <span
          v-show="fileNameInvalid"
          class="file-name-invalid"
        >{{ $t('browsing.download.fileNameInvalid') }}</span>
        <span
          v-show="downloadError"
          class="download-error"
        >{{ $t('browsing.download.startDownloadError') }}</span>
        <div
          v-show="!downloadError && !fileNameInvalid"
          class="premium"
        >
          <span>{{ selectedUnavailable
            ? $t('browsing.download.selectUnavailable') : $t('browsing.download.premium') }}</span>
          <div
            @click="openPremium"
            class="premium-btn"
          >
            {{ $t('browsing.download.premiumBtn') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import { get } from 'lodash';
import Icon from '@/components/BaseIconContainer.vue';
import bookmark from '@/helpers/bookmark';

export default {
  name: 'DownloadList',
  components: {
    Icon,
  },
  data() {
    return {
      showDetailList: false,
      downloadList: [],
      isVip: false,
      path: '',
      url: '',
      selectedItem: {},
      selectedName: '',
      downloadLoading: false,
      dialogOpened: false,
      selectedHovered: false,
      downloadLimited: false,
      downloadError: false,
      dialogHovered: false,
      fileNameInvalid: false,
      errorTimer: 0,
      isDarkMode: false,
    };
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
    fileNameMaxLength() {
      if (this.isDarwin) {
        return this.selectedItem.ext ? 255 - this.selectedItem.ext.length : 255;
      }
      return this.selectedItem.ext && this.path
        ? 242 - this.path.length - this.selectedItem.ext.length : 242;
    },
    pathInitInMas() {
      return this.path === this.$t('browsing.download.clickToSelect');
    },
    selectedUnavailable() {
      return !this.isVip && parseInt(this.selectedItem.definition, 10) > 480;
    },
    selectedItemBackground() {
      if (this.isDarkMode) {
        return this.showDetailList || this.selectedHovered ? '#54545A' : '#4B4B50';
      }
      return this.showDetailList || this.selectedHovered ? '#F7F7F7' : '#FCFCFD';
    },
    selectedItemBorderColor() {
      if (this.isDarkMode) {
        if (this.showDetailList) {
          return 'rgba(255, 255, 255, 0.4)';
        }
        if (this.selectedHovered) {
          return 'rgba(255, 255, 255, 0.25)';
        }
        return '#53535B';
      }
      if (this.showDetailList) {
        return '#FA6400';
      }
      if (this.selectedHovered) {
        return '#CECED4';
      }
      return '#EEEEF0';
    },
    folderBackground() {
      if (this.isDarkMode) {
        return this.dialogOpened || this.dialogHovered ? '#54545A' : '#4B4B50';
      }
      return this.dialogOpened || this.dialogHovered ? '#F7F7F7' : '#FCFCFD';
    },
    folderBorderColor() {
      if (this.isDarkMode) {
        if (this.dialogOpened) {
          return 'rgba(255, 255, 255, 0.4)';
        }
        if (this.dialogHovered) {
          return 'rgba(255, 255, 255, 0.25)';
        }
        return '#53535B';
      }
      if (this.dialogOpened) {
        return '#FA6400';
      }
      if (this.dialogHovered) {
        return '#CECED4';
      }
      return '#EEEEF0';
    },
    downloadBtnBackground() {
      if (this.isDarkMode) {
        if (this.downloadLoading) return '#54545A';
        if (!this.selectedName || this.downloadLimited || this.pathInitInMas
          || this.selectedUnavailable) return '#4B4B50';
        return '';
      }
      if (this.downloadLoading) return 'rgba(255, 148, 0, 1)';
      return '';
    },
    downloadBtnBorderColor() {
      if (this.isDarkMode) {
        if (this.downloadLoading) return '1px solid rgba(255, 255, 255, 0.25)';
        if (!this.selectedName || this.downloadLimited || this.pathInitInMas
          || this.selectedUnavailable) return '1px solid rgba(255, 255, 255, 0)';
        return '';
      }
      if (this.downloadLoading) return '1px solid rgba(251, 99, 0, 1)';
      return '';
    },
  },
  watch: {
    selectedItem(val, oldVal) {
      if (oldVal.name === this.selectedName) {
        this.selectedName = val.name.slice(0, this.fileNameMaxLength);
      }
    },
  },
  created() {
    electron.ipcRenderer.on('init-download-list', (evt, val) => {
      this.downloadList = val.listInfo;
      this.isVip = val.isVip;
      this.path = val.path;
      this.url = val.url;
      this.selectedItem = val.listInfo.length === 1
        ? val.listInfo[0] : val.listInfo.find(i => i.selected);
      this.selectedName = this.selectedItem.name.slice(0, this.fileNameMaxLength);
    });
  },
  mounted() {
    this.isDarkMode = electron.remote.nativeTheme.shouldUseDarkColors;
    electron.remote.nativeTheme.on('updated', () => {
      this.isDarkMode = electron.remote.nativeTheme.shouldUseDarkColors;
    });
    this.$refs.inputFileName.addEventListener('wheel', (e) => {
      if (e.target !== document.activeElement) e.preventDefault();
    });
    window.addEventListener('keydown', (e) => {
      if ([67, 79, 80].includes(e.keyCode) && e.target.tagName === 'INPUT') {
        electron.ipcRenderer.sendTo(electron.remote.getCurrentWindow().webContents.id, 'keydown');
      }
    });
    electron.ipcRenderer.on('update-download-state', (evt, state) => {
      if (state === 'loading') {
        this.downloadLoading = true;
      } else if (state === 'limited') {
        this.downloadLimited = true;
      }
    });
    electron.ipcRenderer.on('start-download-error', () => {
      this.downloadError = true;
      this.fileNameInvalid = false;
      this.downloadLoading = false;
      clearTimeout(this.errorTimer);
      this.errorTimer = setTimeout(() => {
        this.downloadError = false;
      }, 2000);
    });
    electron.ipcRenderer.on('update-is-vip', (evt, isVip) => {
      this.isVip = isVip;
      if (!isVip) {
        if (parseInt(this.selectedItem.definition, 10) > 480) {
          let index = this.downloadList.findIndex(i => parseInt(i.definition, 10) > 480);
          index = index === -1 ? 0 : index - 1;
          this.selectedItem = this.downloadList[index >= 0 ? index : 0];
        }
      } else {
        this.downloadLimited = false;
      }
    });
  },
  methods: {
    handleDialogOver() {
      this.dialogHovered = true;
    },
    handleDialogLeave() {
      this.dialogHovered = false;
    },
    handleSelectedOver() {
      this.selectedHovered = true;
    },
    handleSelectedLeave() {
      this.selectedHovered = false;
    },
    openPremium() {
      electron.ipcRenderer.send('add-preference', 'premium');
    },
    selectSavedPath() {
      this.dialogOpened = true;
      electron.remote.dialog.showOpenDialog(electron.remote.getCurrentWindow(), {
        title: this.$t('browsing.download.saveTo'),
        defaultPath: this.path,
        properties: ['openDirectory'],
        securityScopedBookmarks: process.mas,
      }).then(async (filePath, bookmarks) => {
        if (process.mas && get(bookmarks, 'length') > 0) {
          bookmark.resolveBookmarks(filePath, bookmarks);
        }
        if (!filePath.canceled) {
          this.path = filePath.filePaths[0];
        }
        this.dialogOpened = false;
      });
    },
    handleCancel() {
      electron.ipcRenderer.send('close-download-list', this.url + this.selectedItem.id);
    },
    handleDownload() {
      const fileNameInvalid = (this.isDarwin && (this.selectedName.startsWith('.') || /[/:\\]/.test(this.selectedName))) || (!this.isDarwin && /[\\?<>*|:/]/.test(this.selectedName));
      if (fileNameInvalid) {
        this.fileNameInvalid = true;
        this.downloadError = false;
        clearTimeout(this.errorTimer);
        this.errorTimer = setTimeout(() => {
          this.fileNameInvalid = false;
        }, 2000);
      } else {
        electron.ipcRenderer.send('download-video', {
          id: this.selectedItem.id,
          name: this.selectedName,
          path: this.path,
          ext: this.selectedItem.ext,
          url: this.url,
          time: Date.now(),
        });
        electron.ipcRenderer.sendTo(electron.remote.getCurrentWindow().webContents.id, 'store-download-info', {
          resolution: parseInt(this.selectedItem.definition, 10) || 480, path: this.path,
        });
      }
    },
    handleBlur() {
      if (!this.selectedHovered) this.showDetailList = false;
    },
    handleSelectedItem(item) {
      this.selectedItem = item;
      this.showDetailList = false;
    },
    handleShowDetails() {
      this.showDetailList = !this.showDetailList;
      this.$nextTick(() => {
        if (this.showDetailList) {
          this.$refs.downloadList.focus();
        }
      });
    },
  },
};
</script>

<style scoped lang="scss" src="@/css/darkmode/DownloadList.scss"></style>
