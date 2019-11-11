<template>
  <div
    :style="{
      overflowX: winWidth + (showSidebar ? 0 : 76) < minRatioWidth ? 'scroll' : 'hidden',
      width: isDarwin ? '100%' : 'calc(100% - 1px)'
    }"
    :class="isDarwin ? '' : 'win-scroll'"
    class="home-page-container no-drag"
  >
    <div
      :style="{
        left: winWidth - (showSidebar ? 0 : 76) > 1441 ? '50%' : '',
        transform: winWidth - (showSidebar ? 0 : 76) > 1441 ? 'translateX(-50%)' : '',
      }"
      class="home-page-content"
    >
      <div
        :style="{
          width: `${winWidth - (showSidebar ? 76 : 0) - calcMargin * 2}px`,
          height: currentPhase <= 1 ? `${calcHeight}px` : '314px',
          margin: `0 ${calcMargin}px`,
        }"
        class="account-content"
      >
        <span
          :style="{
            fontSize: `${titleSize}px`,
            margin: `${titlePos.marginTop}px 0
              0 ${titlePos.marginLeft}px`,
            color: '#3B3B41',
            fontWeight: 'bold',
          }"
        >{{ $t('welcome.welcomeTitle') }}</span>
        <div
          :style="{
            margin: `auto 0 ${userPos}px ${userPos}px`,
          }"
          class="user-content"
        >
          <div
            :style="{
              fontSize: `${userStateSize}px`,
              color: '#818188',
              display: 'block',
              fontWeight: 'bold',
              marginBottom: `${userStatePos}px`,
            }"
          >
            {{ isLogin ? (userInfo.isVip ? $t('browsing.homepage.premiumAccount')
              : $t('browsing.homepage.account')) +
              `${displayName}` : '' }}
            <div
              :style="{
                marginLeft: `${userStatePos}px`,
                fontSize: `${moreInfoSize}px`,
              }"
              @click="handleLogout"
              v-show="isLogin"
              class="sign-out"
            >
              {{ $t('browsing.homepage.signOut') }}
            </div>
          </div>
          <span
            :style="{
              fontSize: `${moreInfoSize}px`,
              color: '#8F8F96',
            }"
          >
            {{ isLogin ? userInfo.isVip ? $t('browsing.homepage.premiumInfo')
              + `${userInfo.vipExpiredAt}`: $t('browsing.homepage.accountInfo')
              : $t('browsing.homepage.signInfo') }}
          </span>
          <button
            :style="{
              outline: 'none',
              width: `${buttonSize.width}px`,
              height: `${buttonSize.height}px`,
              background: '#FF8400',
              marginTop: `${buttonPos}px`,
              borderRadius: '3px',
              color: '#ffffff',
              fontSize: `${buttonFontSize}px`,
              cursor: 'pointer',
              zIndex: 1,
              border: 'none',
            }"
            @click="handleLogin"
          >
            {{ isLogin ? userInfo.isVip ? $t('browsing.homepage.renewBtn') :
              $t('browsing.homepage.premiumBtn') : $t('browsing.homepage.signBtn') }}
          </button>
        </div>
        <span
          :style="{
            color: 'rgba(138, 138, 145, 0.6)',
            fontSize: `${versionSize}px`,
            position: 'absolute',
            right: `${versionPos.right}px`,
            bottom: `${versionPos.bottom}px`,
          }"
        >{{ `Version ${currentVersion}` }}</span>
        <div
          :style="{
            width: `${logoSize}px`,
            height: `${logoSize}px`,
            top: `${logoPos.top}px`,
            right: `${logoPos.right}px`,
          }"
          class="back-logo"
        >
          <Icon type="homePageLogo" />
        </div>
        <div class="account-mask" />
      </div>
      <browsing-adv
        :width="calcWidth"
        :height="advHeight"
        :content-pos="advPos"
        :padding="calcMargin"
        :right-space="rightSpace"
        :calc-size-by-phase="calcSizeByPhase"
      />
      <browsing-history
        :show-home-page="showHomePage"
        :playlist-font-size="playlistFontSize"
        :padding="calcMargin"
        :calc-size-by-phase="calcSizeByPhase"
      />
      <browsing-local-playlist
        :width="calcWidth"
        :playlist-font-size="playlistFontSize"
        :padding="calcMargin"
        :list-right="listRight"
        :list-item-font-size="listItemFontSize"
        :calc-size-by-phase="calcSizeByPhase"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import { version } from '@/../../package.json';
import BrowsingHistory from '@/components/BrowsingView/BrowsingHistory.vue';
import BrowsingAdv from './BrowsingAdv.vue';
import BrowsingLocalPlaylist from './BrowsingLocalPlaylist.vue';
import Icon from '../BaseIconContainer.vue';

export default {
  name: 'BrowsingHomePage',
  components: {
    Icon,
    'browsing-adv': BrowsingAdv,
    'browsing-local-playlist': BrowsingLocalPlaylist,
    'browsing-history': BrowsingHistory,
  },
  props: {
    showHomePage: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      currentPhase: 2,
      isLogin: false,
      displayName: '',
      minRatioWidth: 888,
      maxRatioWidth: 1030,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'showSidebar', 'userInfo']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    currentVersion() {
      return version;
    },
    calcWidth() {
      return this.calcSize(710.6, 834);
    },
    calcHeight() {
      return this.calcSize(232, 314);
    },
    calcMargin() {
      return [50.7, this.calcSize(50.7, 60), 60][this.currentPhase];
    },
    titlePos() {
      return {
        marginLeft: this.calcSizeByPhase(30),
        marginTop: this.calcSizeByPhase(45),
      };
    },
    titleSize() {
      return this.calcSizeByPhase(44);
    },
    userPos() {
      return this.calcSizeByPhase(30);
    },
    userStateSize() {
      return this.calcSizeByPhase(20);
    },
    userStatePos() {
      return this.calcSizeByPhase(6);
    },
    moreInfoSize() {
      return this.calcSizeByPhase(14);
    },
    buttonFontSize() {
      return [11, this.calcSize(11, 15), 15][this.currentPhase];
    },
    buttonSize() {
      return {
        width: [101, this.calcSize(101, 136), 136][this.currentPhase],
        height: [31, this.calcSize(31, 41), 41][this.currentPhase],
      };
    },
    buttonPos() {
      return [15, this.calcSize(15, 21), 21][this.currentPhase];
    },
    rightSpace() {
      return [11, this.calcSize(11, 16), 16][this.currentPhase];
    },
    listRight() {
      return [11, this.calcSize(11, 16), 16][this.currentPhase];
    },
    listItemFontSize() {
      return [11, this.calcSize(11, 14), 14][this.currentPhase];
    },
    logoSize() {
      return this.calcSizeByPhase(360);
    },
    logoPos() {
      return {
        top: this.calcSizeByPhase(36.8),
        right: this.calcSizeByPhase(-50),
      };
    },
    versionSize() {
      return this.calcSizeByPhase(12);
    },
    versionPos() {
      return {
        bottom: this.calcSizeByPhase(30),
        right: this.calcSizeByPhase(50),
      };
    },
    advHeight() {
      return [107, this.calcSize(107, 144), 144][this.currentPhase];
    },
    playlistFontSize() {
      return this.calcSizeByPhase(25);
    },
    advPos() {
      return {
        marginTop: this.calcSizeByPhase(20),
        marginBottom: this.calcSizeByPhase(30),
      };
    },
  },
  watch: {
    winWidth(val: number) {
      if (val > 0 && val < this.minRatioWidth) {
        this.currentPhase = 0;
      } else if (val >= this.minRatioWidth && val < this.maxRatioWidth) {
        this.currentPhase = 1;
      } else if (val >= this.maxRatioWidth) {
        this.currentPhase = 2;
      }
    },
  },
  mounted() {
    this.$electron.ipcRenderer.on('sign-in', (evt: Event, account?: { displayName: string, token: string}) => {
      if (account) {
        this.isLogin = true;
        this.displayName = account.displayName;
      } else {
        this.isLogin = false;
        this.displayName = '';
      }
    });
  },
  methods: {
    calcSize(min: number, max: number) {
      const a = (max - min) / (this.maxRatioWidth - this.minRatioWidth);
      const b = min - this.minRatioWidth * a;
      return a * this.winWidth + b;
    },
    calcSizeByPhase(val: number) {
      return [val * this.minRatioWidth / this.maxRatioWidth,
        val * this.winWidth / this.maxRatioWidth, val][this.currentPhase];
    },
    handleLogin() {
      if (!this.isLogin) {
        this.$electron.remote.app.emit('add-login');
      } else {
        this.$electron.ipcRenderer.send('add-preference', 'premium');
      }
    },
    handleLogout() {
      this.$electron.remote.app.emit('sign-out-confirm');
    },
  },
};
</script>

<style scoped lang="scss">
.win-scroll {
  &::-webkit-scrollbar {
    width: 9px;
    height: 9px;
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 8px;
    border: 0.5px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(0, 0, 0, 0.4);
  }
}
.home-page-container {
  height: calc(100% - 40px);
  top: 40px;
  display: flex;
  position: relative;
  overflow-y: scroll;
  .home-page-content {
    width: auto;
    height: auto;
    display: flex;
    flex-direction: column;
    position: absolute;
    max-width: 1441px;
    .account-content {
      position: relative;
      width: 100%;
      height: auto;
      min-width: 710.6px;
      min-height: 232px;
      border-radius: 0 0 7px 7px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      max-width: 1321px;
      background-image: linear-gradient(180deg, rgba(255,255,255,0.40) 10%, #E6E6E6 100%);
      .back-logo {
        position: absolute;
        width: 226px;
        height: 204px;
        right: 0;
      }
      .account-mask {
        top: 0;
        position: absolute;
        width: 100%;
        height: 100%;
        background: url('../../assets/homePageNoise.png');
      }
      .user-content {
        width: auto;
        height: auto;
        display: flex;
        flex-direction: column;
        z-index: 1;
      }
      .sign-out {
        font-weight: lighter;
        cursor: pointer;
        display: inline-block;
        color: #8F8F96;
        transition: color 100ms linear;
        &:hover {
          color: #818188;
        }
      }
    }
  }
}
</style>
