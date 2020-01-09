<template>
  <div class="mask">
    <div class="list-container">
      <div class="list-items">
        <div class="file-name">
          <span>{{ $t('browsing.download.fileName') }}</span>
          <div class="file-input">
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
              background: showDetailList || selectedHovered ? '#F7F7F7' : '#FCFCFD',
              borderColor: showDetailList ? '#FA6400' : selectedHovered ? '#CECED4' : '#EEEEF0',
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
<!--            <Icon-->
<!--              v-show="parseInt(selectedItem.definition, 10) > 480"-->
<!--              :type="selectedUnavailable ? 'vipDownload': 'vipDownloadAvailable'"-->
<!--              class="vip-marks"-->
<!--            />-->
            <Icon
              :style="{
                opacity: showDetailList || selectedHovered ? 1 : 0.35
              }"
              type="definitionMore"
            />
          </div>
          <transition name="fade">
            <div
              ref="downloadList"
              v-show="showDetailList"
              @blur="handleBlur"
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
<!--                  <Icon-->
<!--                    v-show="parseInt(item.definition, 10) > 480"-->
<!--                    :type="isVip ? 'vipDownloadAvailable' : 'vipDownload'"-->
<!--                  />-->
                </div>
              </div>
            </div>
          </transition>
        </div>
        <div class="save-folder">
          <span>{{ $t('browsing.download.saveTo') }}</span>
          <div
            :style="{
              borderColor: dialogOpened ? '#FA6400' : dialogHovered ? '#CECED4' : '#EEEEF0',
              background: dialogOpened || dialogHovered ? '#F7F7F7' : '#FCFCFD',
            }"
            @click="selectSavedPath"
            @mouseover="handleDialogOver"
            @mouseleave="handleDialogLeave"
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
              type="fileSaveSelected"
            ></Icon>
          </div>
        </div>
        <div class="bottom-btns">
          <button
            @click="handleCancel"
            class="cancel"
          >
            {{ $t('browsing.download.cancel') }}
          </button>
          <button
            @click="handleDownload"
            :style="{
              opacity: !selectedName || downloadLimited
                || pathInitInMas || selectedUnavailable ? '0.5' : '',
              pointerEvents: !selectedName || downloadLoading || selectedUnavailable
                || downloadLimited || pathInitInMas ? 'none' : 'auto',
            }"
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
        class="footer"
      >
        <span
          :style="{ color: '#FA6400' }"
          v-show="fileNameInvalid"
        >{{ $t('browsing.download.fileNameInvalid') }}</span>
        <span
          :style="{ color: '#FA6400' }"
          v-show="downloadError"
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
      }, async (filePath, bookmarks) => {
        if (process.mas && get(bookmarks, 'length') > 0) {
          bookmark.resolveBookmarks(filePath, bookmarks);
        }
        if (filePath) {
          this.path = filePath[0];
          this.dialogOpened = false;
        } else {
          this.dialogOpened = false;
        }
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

<style scoped lang="scss">
::-webkit-scrollbar {
  width: 3px;
  background: transparent;
}
::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background-color: #717382;
}
* {
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-user-drag: none;
  font-family: $font-normal;
}
.mask {
  width: 100%;
  height: 100%;
  position: relative;
  background: rgba(0, 0, 0, 0.4);
}
.list-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 341px;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  border: 1px solid #F2F2F2;
  border-radius: 5px;
  .list-items {
    width: 312px;
    height: 251px;
    margin: 40px 24px 15px 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .file-name, .definition {
      width: 100%;
      height: auto;
      min-height: 54px;
      margin-bottom: 15px;
      position: relative;
      z-index: 10;
      span {
        font-size: 12px;
        color: #717382;
        margin-bottom: 6px;
        line-height: 12px;
      }
    }

    .save-folder {
      width: 100%;
      height: auto;
      margin-bottom: 25px;
      display: flex;
      flex-direction: column;
      span {
        font-size: 12px;
        color: #717382;
        margin-bottom: 6px;
        line-height: 12px;
      }
    }

    .vip {
      width: 15px;
      height: 8px;
      margin: auto 0 auto 3px;
    }

    .folder-content {
      width: 100%;
      height: 36px;
      border: 1px solid #EEEEF0;
      box-sizing: border-box;
      border-radius: 2px;
      display: flex;
      background: #FCFCFD;
      transition: all 100ms linear;
      position: relative;
      span {
        font-size: 12px;
        color: #666C77;
        margin: auto 0 auto 12px;
        max-width: 250px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 16px;
      }
    }

    .definition-content {
      width: 312px;
      min-height: 36px;
      max-height: 109px;
      height: auto;
      border-width: 0 1px 1px 1px;
      border-style: solid;
      border-color: #FA6400;
      box-sizing: border-box;
      border-radius: 0 0 2px 2px;
      z-index: 10;
      top: 18px;
      background: #FCFCFD;
      outline: none;
      .scroll-content {
        width: calc(100% - 2px);
        height: auto;
        min-height: 36px;
        max-height: 108px;
        overflow-x: hidden;
      }
      .definition-item {
        width: 311px;
        height: 35px;
        display: flex;
        background: #FFFFFF;
        &:hover {
          background: #F7F7F7;
        }
        span {
          font-size: 12px;
          color: #666C77;
          margin: auto 0 auto 12px;
        }
      }
    }

    .selected-item {
      width: 312px;
      height: 35px;
      z-index: 10;
      display: flex;
      padding: 0 12px;
      justify-content: space-between;
      box-sizing: border-box;
      border-radius: 2px;
      border-style: solid;
      transition: all 100ms linear;
      .vip-marks {
        margin: auto auto auto 3px;
      }
      span {
        margin-top: auto;
        margin-bottom: auto;
        font-size: 12px;
        color: #666C77;
      }
    }

    .file-input {
      width: 100%;
      height: 36px;
      border: 1px solid #EEEEF0;
      box-sizing: border-box;
      border-radius: 2px;
      background: #FCFCFD;
      transition: all 100ms linear;
      &:hover {
        border: 1px solid #CECED4;
        background: #F7F7F7;
      }
      &:focus-within {
        border-color: #FA6400;
        background: #F7F7F7;
      }
      input {
        width: calc(100% - 24px);
        height: 34px;
        border: none;
        padding: 0 12px 0 12px;
        outline: none;
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #666C77;
      }
    }

    .bottom-btns {
      display: flex;
      justify-content: space-between;
      height: 34px;
      width: 312px;
      margin: 0 0 15px 0;
    }

    .cancel {
      background: rgba(233, 233, 233, 0.8);
      border: 1px solid rgba(208, 208, 208, 0.8);
      color: rgba(113, 115, 130, 0.8);
      &:hover {
        background: rgba(233, 233, 233, 1);
        border: 1px solid rgba(208, 208, 208, 1);
        color: rgba(113, 115, 130, 1);
      }
    }

    .download {
      background: rgba(255, 148, 0, 0.8);
      border: 1px solid rgba(251, 99, 0, 0.8);
      color: rgba(255, 255, 255, 0.8);
      &:hover {
        background: rgba(255, 148, 0, 1);
        border: 1px solid rgba(251, 99, 0, 1);
        color: rgba(255, 255, 255, 1);
      }
    }
  }

  button {
    width: 146px;
    height: 34px;
    border-radius: 2px;
    transition: all 150ms linear;
    font-size: 12px;
    outline: none;
  }

  .footer {
    text-align: center;
    font-size: 11px;
    color: #717382;
    .premium {
      .premium-btn {
        cursor: pointer;
        display: inline;
        text-decoration: underline;
        transition: color 100ms linear;
        &:hover {
          color: #FA6400
        }
      }
    }
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .1s linear;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
