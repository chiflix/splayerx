<template>
  <div class="preference tablist">
    <div class="tablist__tabs">
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
      <div
        :class="currentPreference === 'General' ? 'tablist__tab--selected' : ''"
        @mouseup="handleMouseup('General')"
        class="tablist__tab"
      >
        {{ $t('preferences.general.generalSetting') }}
      </div>
      <div
        :class="currentPreference === 'Privacy' ? 'tablist__tab--selected' : ''"
        @mouseup="handleMouseup('Privacy')"
        class="tablist__tab"
      >
        {{ $t('preferences.privacy.privacySetting') }}
      </div>
    </div>
    <div class="tablist__tabpanel">
      <div
        v-if="!isDarwin"
        @mouseover="state = 'hover'"
        @mouseout="state = 'default'"
        class="titlebar titlebar--win no-drag"
      >
        <Icon
          class="titlebar__button--disable"
          type="titleBarWinExitFull"
        />
        <Icon
          class="titlebar__button--disable"
          type="titleBarWinFull"
        />
        <Icon
          @click.native="handleClose"
          class="titlebar__button"
          type="titleBarWinClose"
        />
      </div>
      <div class="tablist__tabcontent">
        <keep-alive>
          <!-- eslint-disable-next-line vue/require-component-is -->
          <component
            :is="currentPreference"
            :mouse-down="mouseDown"
            :is-moved="isMoved"
            @move-stoped="isMoved = false"
          />
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import path, {
  basename, dirname, extname, join,
} from 'path';
import fs from 'fs';
import { uniq } from 'lodash';
import electron from 'electron';
import Icon from '@/components/BaseIconContainer.vue';
import General from './Preferences/General.vue';
import Privacy from './Preferences/Privacy.vue';
import { getValidVideoRegex } from '../../shared/utils';

Vue.component('General', General);
Vue.component('Privacy', Privacy);

export default {
  name: 'Preference',
  components: {
    Icon,
  },
  data() {
    return {
      state: 'default',
      currentPreference: 'General',
      mouseDown: false,
      isMoved: false,
    };
  },
  mounted() {
    console.log(this.openSubtitle(true, '/Users/tanyang/Desktop/Bon Jovi - Walls-_SWSdUPMLMI.vtt'));
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  created() {
    electron.ipcRenderer.on('preferenceDispatch', (event, actionType, actionPayload) => {
      this.mainDispatchProxy(actionType, actionPayload);
    });
    window.onmousedown = () => {
      this.mouseDown = true;
      this.isMoved = false;
    };
    window.onmousemove = () => {
      if (this.mouseDown) this.isMoved = true;
    };
    window.onmouseup = () => {
      this.mouseDown = false;
    };
  },
  beforeDestroy() {
    window.onmousedown = null;
    window.onmousemove = null;
    window.onmouseup = null;
  },
  methods: {
    // Methods to handle window behavior
    handleClose() {
      electron.remote.getCurrentWindow().close();
    },
    mainDispatchProxy(actionType, actionPayload) {
      this.$store.dispatch(actionType, actionPayload);
    },
    handleMouseup(panel) {
      this.currentPreference = panel;
    },
    searchForLocalVideo(subSrc) {
      const videoDir = dirname(subSrc);
      const videoBasename = basename(subSrc, extname(subSrc)).toLowerCase();
      const videoFilename = basename(subSrc).toLowerCase();
      const dirFiles = fs.readdirSync(videoDir);
      return dirFiles
        .filter((subtitleFilename) => {
          const lowerCasedName = subtitleFilename.toLowerCase();
          return (
            getValidVideoRegex().test(lowerCasedName)
            && lowerCasedName.slice(0, lowerCasedName.lastIndexOf('.')) === videoBasename
            && lowerCasedName !== videoFilename
          );
        })
        .map(subtitleFilename => (join(videoDir, subtitleFilename)));
    },
    openSubtitle(onlySubtitle, ...files) {
      try {
        const videoFiles = [];
        const subRegex = new RegExp('^\\.(srt|ass|vtt)$', 'i');
        for (let i = 0; i < files.length; i += 1) {
          if (fs.statSync(files[i]).isDirectory()) {
            const dirPath = files[i];
            const dirFiles = fs.readdirSync(dirPath).map(file => path.join(dirPath, file));
            files.push(...dirFiles);
          }
        }
        if (!process.mas) {
          files.forEach((tempFilePath) => {
            const baseName = path.basename(tempFilePath);
            if (baseName.startsWith('.') || fs.statSync(tempFilePath).isDirectory()) return;
            if (subRegex.test(path.extname(tempFilePath))) {
              const tempVideo = this.searchForLocalVideo(tempFilePath);
              videoFiles.push(...tempVideo);
            } else if (!subRegex.test(path.extname(tempFilePath))
              && getValidVideoRegex().test(tempFilePath)) {
              videoFiles.push(tempFilePath);
            }
          });
        } else if (!onlySubtitle) {
          files.forEach((tempFilePath) => {
            const baseName = path.basename(tempFilePath);
            if (baseName.startsWith('.') || fs.statSync(tempFilePath).isDirectory()) return;
            if (!subRegex.test(path.extname(tempFilePath))
              && getValidVideoRegex().test(tempFilePath)) {
              videoFiles.push(tempFilePath);
            }
          });
        }
        return uniq(videoFiles);
      } catch (ex) {
        return [];
        // log.info('openFile', ex);
        // addBubble(OPEN_FAILED, this.$i18n);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.preference {
  .titlebar {
    display: flex;
    flex-wrap: nowrap;

    &--mac {
      margin-top: 12px;
      margin-left: 12px;
      margin-bottom: 18px;
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
      top: 0;
      right: 0;
      position: fixed;

      .titlebar__button {
        margin: 0px 2px 2px 0px;
        width: 45px;
        height: 28px;
        background-color: rgba(255,255,255,0);
        transition: background-color 200ms;

        &--disable {
          pointer-events: none;
          opacity: 0.25;
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
}
.tablist {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

  &__tabs {
    width: 110px;
    height: 100%;
    background-image: linear-gradient(
      -28deg,
      rgba(65,65,65,0.97) 0%,
      rgba(84,84,84,0.97) 47%,
      rgba(123,123,123,0.97) 100%
    );
  }

  &__tab {
    cursor: pointer;
    -webkit-app-region: no-drag;
    font-family: $font-semibold;
    font-size: 14px;
    padding-left: 15px;
    letter-spacing: 0;
    line-height: 42px;
    color: rgba(255,255,255,0.3);
    border-left: 1px solid rgba(0,0,0,0);
    background-color: rgba(255,255,255,0);
    transition: background-color 200ms;
    &:hover {
      background-color: rgba(255,255,255,0.03);
    }

    &--selected {
      color: rgba(255,255,255,1);
      border-left: 1px solid white;
      background-image: linear-gradient(
        99deg,
        rgba(243,243,243,0.15) 0%,
        rgba(255,255,255,0.0675) 81%
      );
      &:hover {
        background-color: rgba(255,255,255,0);
      }
    }
  }

  &__tabpanel {
    width: 430px;
    background-image: linear-gradient(
      -28deg,
      rgba(65,65,65,0.99) 0%,
      rgba(84,84,84,0.99) 47%,
      rgba(123,123,123,0.99) 100%
    );
  }

  &__tabcontent {
    padding: 32px 32px;
  }
}
</style>
