<template>
  <div class="list-container">
    <div class="list-items">
      <div class="file-name">
        <span>{{ $t('browsing.download.filename') }}</span>
        <div class="file-input">
          <input
            v-model="selectedName"
            class="name-content"
          >
        </div>
      </div>
      <div class="definition">
        <span>{{ $t('browsing.download.resolution') }}</span>
        <div
          :style="{
            background: showDetailList ? '#F4F4F4' : '#FCFCFD',
            borderColor: showDetailList ? '#FA6400' : '#EEEEF0',
            borderWidth: showDetailList ? '1px 1px 0 1px' : '1px 1px 1px 1px',
            borderRadius: showDetailList ? '2px 2px 0 0' : '2px'
          }"
          @click="handleShowDetails"
          @mouseover="handleSelectedOver"
          @mouseleave="handleSelectedLeave"
          class="selected-item"
        >
          <span>{{ selectedItem.definition }}</span>
          <Icon
            v-show="parseInt(selectedItem.definition, 10) > 480"
            type="vipDownloadAvailable"
            class="vip-marks"
          />
          <Icon
            :style="{
              opacity: showDetailList ? 1 : 0.25
            }"
            type="definitionMore"
          />
        </div>
        <div
          ref="downloadList"
          v-show="showDetailList"
          @blur="handleBlur"
          class="definition-content"
          tabindex="1"
        >
          <div class="scroll-content">
            <div
              v-show="item.id !== selectedItem.id"
              :style="{
                pointerEvents: isVip || parseInt(item.definition, 10) <= 480 ? 'auto' : 'none'
              }"
              v-for="(item) in downloadList"
              @click="handleSelectedItem(item)"
              class="definition-item"
            >
              <span
                :style="{
                  opacity: isVip || parseInt(item.definition, 10) <= 480 ? 1 : 0.4,
                }"
              >{{ item.definition }}</span>
              <Icon
                v-show="parseInt(item.definition, 10) > 480"
                :type="isVip ? 'vipDownloadAvailable' : 'vipDownload'"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="save-folder">
        <span>{{ $t('browsing.download.saveTo') }}</span>
        <div
          :style="{
            borderColor: dialogOpened ? '#FA6400' : '#EEEEF0'
          }"
          @click="selectSavedPath"
          class="folder-content"
        >
          <span>{{ path }}</span>
          <Icon :type="dialogOpened ? 'fileSaveSelected' : 'fileSave'"></Icon>
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
            opacity: !selectedName || downloadLimited ? '0.5' : '',
            pointerEvents: !selectedName || downloadLoading || downloadLimited ? 'none' : 'auto',
          }"
          class="download"
        >
          {{ downloadLoading ? $t('browsing.download.loading')
            : downloadLimited ? $t('browsing.download.limited') : $t('browsing.download.submit') }}
        </button>
      </div>
    </div>
    <div
      v-show="!isVip || downloadError"
      :style="{
        pointerEvents: downloadError ? 'none' : 'auto'
      }"
      @mouseover="handlePremiumOver"
      @mouseleave="handlePremiumLeave"
      @click="openPremium"
      class="footer"
    >
      <span
        v-html="downloadError ?
          $t('browsing.download.startDownloadError') : $t('browsing.download.premium')"></span>
      <div class="more-icon">
        <transition name="fade">
          <Icon
            v-show="!premiumHovered"
            type="premiumMore"
          />
        </transition>
        <transition name="fade">
          <Icon
            v-show="premiumHovered"
            type="premiumMoreHover"
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import electron from 'electron';
import path from 'path';
import Icon from '@/components/BaseIconContainer.vue';

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
      premiumHovered: false,
      selectedItem: {},
      selectedName: '',
      downloadLoading: false,
      dialogOpened: false,
      selectedHovered: false,
      downloadLimited: false,
      downloadError: false,
    };
  },
  watch: {
    selectedItem(val) {
      this.selectedName = val.name;
    },
  },
  created() {
    electron.ipcRenderer.on('init-download-list', (evt, val) => {
      this.downloadList = val.listInfo;
      this.isVip = val.isVip;
      this.path = val.path;
      this.url = val.url;
      this.selectedItem = val.listInfo.find(i => i.selected);
      this.selectedName = this.selectedItem.name;
    });
  },
  mounted() {
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
      this.downloadLoading = false;
      setTimeout(() => {
        this.downloadError = false;
      }, 2000);
    });
    electron.ipcRenderer.on('update-is-vip', (evt, isVip) => {
      this.isVip = isVip;
      if (!isVip) {
        if (parseInt(this.selectedItem.definition, 10) > 480) {
          let index = this.downloadList.findIndex(i => parseInt(i.definition, 10) > 480);
          index = index === -1 ? 0 : index - 1;
          this.selectedItem = this.downloadList[index];
        }
      } else {
        this.downloadLimited = false;
      }
    });
  },
  methods: {
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
      electron.remote.dialog.showSaveDialog(electron.remote.getCurrentWindow(), {
        defaultPath: path.join(this.path, this.selectedItem.name),
      }, async (filePath) => {
        if (filePath) {
          const index = filePath.lastIndexOf(process.platform === 'darwin' ? '/' : '\\');
          this.path = filePath.slice(0, index);
          this.selectedName = filePath.slice(index + 1, filePath.length);
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
      electron.ipcRenderer.send('download-video', {
        id: this.selectedItem.id,
        name: this.selectedItem.name,
        path: this.path,
        ext: this.selectedItem.ext,
        url: this.url,
      });
      electron.ipcRenderer.sendTo(electron.remote.getCurrentWindow().webContents.id, 'store-download-info', {
        resolution: parseInt(this.selectedItem.definition, 10), path: this.path,
      });
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
    handlePremiumOver() {
      this.premiumHovered = true;
    },
    handlePremiumLeave() {
      this.premiumHovered = false;
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
  font-family: Avenir, Roboto-Regular, 'PingFang SC', 'Microsoft Yahei';
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
      position: relative;
      span {
        font-size: 12px;
        color: #666C77;
        margin: auto 0 auto 12px;
        max-width: 250px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
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
          background: #F4F4F4;
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
      height: 36px;
      z-index: 10;
      display: flex;
      padding: 0 12px;
      justify-content: space-between;
      box-sizing: border-box;
      border-radius: 2px;
      border-style: solid;
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
      &:focus-within {
        border-color: #FA6400;
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

    .name-content {
      background: #FCFCFD;
      &:focus {
        background: #FFFFFF;
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
    font-size: 10px;
    color: #717382;
    .more-icon {
      width: 12px;
      height: 12px;
      position: relative;
      display: inline;
    }
    span {
      color: #717382;
      transition: color 100ms linear;
      &:hover {
        color: #FA6400
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
