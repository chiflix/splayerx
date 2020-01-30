<template>
  <div
    :style="{
      overflowX: winWidth + (showSidebar ? 0 : 76) < minRatioWidth ? 'scroll' : 'hidden',
      width: isDarwin ? '100%' : 'calc(100% - 1px)',
      background: isDarkMode ? '#434348' : '#FFFFFF',
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
          backgroundImage: isDarkMode
            ? 'linear-gradient(180deg, rgba(53,53,58,0.35) 1%, #35353A 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.40) 10%, #E6E6E6 100%)',
        }"
        class="account-content"
      >
        <span
          :style="{
            fontSize: `${titleSize}px`,
            margin: `${titlePos.marginTop}px 0
              0 ${titlePos.marginLeft}px`,
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
              display: 'block',
              fontWeight: 'bold',
              marginBottom: `${userStatePos}px`,
            }"
          >
            {{ isLogin ? $t('browsing.homepage.account') + `${displayName}` : '' }}
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
            }"
          >
            <span v-if="isLogin">
              {{ $t('browsing.homepage.premiumInfo') + `${userInfo.createdAt}` }}
            </span>
            <span v-if="!isLogin && !isMas">
              {{ $t('browsing.homepage.signInfo') }}
            </span>
          </span>
          <button
            v-if="!isMas"
            :style="{
              outline: 'none',
              width: `${buttonSize.width}px`,
              height: `${buttonSize.height}px`,
              marginTop: `${buttonPos}px`,
              borderRadius: '3px',
              fontSize: `${buttonFontSize}px`,
              cursor: 'pointer',
              zIndex: 1,
              opacity: isLogin ? '0' : '',
              pointerEvents: isLogin ? 'none' : 'auto',
            }"
            @click="handleLogin"
          >
            {{ $t('browsing.homepage.signBtn') }}
          </button>
        </div>
        <span
          :style="{
            fontSize: `${versionSize}px`,
            position: 'absolute',
            right: `${versionPos.right}px`,
            bottom: `${versionPos.bottom}px`,
          }"
          class="version"
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
          <Icon :type="isDarkMode ? 'homePageLogoDark' : 'homePageLogo'" />
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
    ...mapGetters(['winWidth', 'showSidebar', 'userInfo', 'isDarkMode']),
    isDarwin() {
      return process.platform === 'darwin';
    },
    isMas() {
      return !!process.mas;
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
  created() {
    if (this.userInfo.id) {
      this.isLogin = true;
      this.displayName = this.userInfo.displayName;
    } else {
      this.isLogin = false;
      this.displayName = '';
    }
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

<style scoped lang="scss" src="@/css/darkmode/BrowsingHomePage/BrowsingHomePage.scss">
</style>
