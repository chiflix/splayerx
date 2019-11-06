<template>
  <div
    :style="{
      overflowX: winWidth + (showSidebar ? 0 : 76) < 888 ? 'scroll' : '',
    }"
    class="home-page-container"
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
          width: `${winWidth - (showSidebar ? 76 : 0) - calcMargin[currentPhase] * 2}px`,
          height: currentPhase <= 1 ? `${calcHeight}px` : '314px',
          margin: `0 ${calcMargin[currentPhase]}px`,
        }"
        class="account-content"
      >
        <span
          :style="{
            fontSize: `${titleSize[currentPhase]}px`,
            margin: `${titlePos.marginTop[currentPhase]}px 0
              0 ${titlePos.marginLeft[currentPhase]}px`,
            color: '#3B3B41',
          }"
        >{{ $t('welcome.welcomeTitle') }}</span>
        <div
          :style="{
            margin: `auto 0 ${userPos[currentPhase]}px ${userPos[currentPhase]}px`,
          }"
          class="user-content"
        >
          <div
            :style="{
              fontSize: `${userStateSize[currentPhase]}px`,
              color: '#818188',
              display: 'block',
            }"
          >
            {{ isLogin ? (userInfo.isVip ? $t('browsing.homepage.premiumAccount')
              : $t('browsing.homepage.account')) +
              `${displayName}  |  ` : $t('browsing.homepage.unSigned') }}
            <div
              :style="{
                fontWeight: 'lighter',
                cursor: 'pointer',
                display: 'inline-block',
              }"
              @click="handleLogout"
              v-show="isLogin"
            >
              {{ $t('browsing.homepage.signOut') }}
            </div>
          </div>
          <span
            :style="{
              fontSize: `${moreInfoSize[currentPhase]}px`,
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
              width: `${buttonSize.width[currentPhase]}px`,
              height: `${buttonSize.height[currentPhase]}px`,
              background: '#FF8400',
              marginTop: `${buttonPos[currentPhase]}px`,
              borderRadius: '3px',
              color: '#ffffff',
              fontSize: `${moreInfoSize[currentPhase]}px`,
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
            color: '#8A8A91',
            fontSize: `${versionSize[currentPhase]}px`,
            position: 'absolute',
            right: `${versionPos.right[currentPhase]}px`,
            bottom: `${versionPos.bottom[currentPhase]}px`,
          }"
        >{{ `Version ${currentVersion}` }}</span>
        <div
          :style="{
            width: `${logoSize[currentPhase]}px`,
            height: `${logoSize[currentPhase]}px`,
            top: `${logoPos.top[currentPhase]}px`,
            right: `${logoPos.right[currentPhase]}px`,
          }"
          class="back-logo"
        >
          <Icon type="homePageLogo" />
        </div>
        <div class="account-mask" />
      </div>
      <browsing-adv
        :width="calcWidth"
        :height="advHeight[currentPhase]"
        :padding="calcMargin[currentPhase]"
        :current-phase="currentPhase"
        :adapt-space="calcSize(11, 16)"
        :style="{
          margin: `${advPos.marginTop[currentPhase]}px 0 ${advPos.marginBottom[currentPhase]}px 0`,
        }"
      />
      <browsing-history
        :show-home-page="showHomePage"
        :playlist-font-size="playlistFontSize"
        :padding="calcMargin[currentPhase]"
        :current-phase="currentPhase"
      />
      <browsing-local-playlist
        :width="calcWidth"
        :playlist-font-size="playlistFontSize"
        :padding="calcMargin[currentPhase]"
        :current-phase="currentPhase"
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
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'showSidebar', 'userInfo']),
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
      return [50.7, this.calcSize(50.7, 60), 60];
    },
    titlePos() {
      return {
        marginLeft: [30 * 888 / 1030, 30 * this.winWidth / 1030, 30],
        marginTop: [45 * 888 / 1030, 45 * this.winWidth / 1030, 45],
      };
    },
    titleSize() {
      return [44 * 888 / 1030, 44 * this.winWidth / 1030, 44];
    },
    userPos() {
      return [30 * 888 / 1030, 30 * this.winWidth / 1030, 30];
    },
    userStateSize() {
      return [14, this.calcSize(14, 19), 19];
    },
    moreInfoSize() {
      return [11, this.calcSize(11, 15), 15];
    },
    buttonSize() {
      return {
        width: [101, this.calcSize(101, 136), 136],
        height: [31, this.calcSize(31, 41), 41],
      };
    },
    buttonPos() {
      return [15, this.calcSize(15, 21), 21];
    },
    logoSize() {
      return [360 * 888 / 1030, 360 * this.winWidth / 1030, 360];
    },
    logoPos() {
      return {
        top: [36.8 * 888 / 1030, 36.8 * this.winWidth / 1030, 36.8],
        right: [-50 * 888 / 1030, -50 * this.winWidth / 1030, -50],
      };
    },
    versionSize() {
      return [11, this.calcSize(11, 15), 15];
    },
    versionPos() {
      return {
        bottom: [30 * 888 / 1030, 30 * this.winWidth / 1030, 30],
        right: [50 * 888 / 1030, 50 * this.winWidth / 1030, 50],
      };
    },
    advHeight() {
      return [107, this.calcSize(107, 144), 144];
    },
    playlistFontSize() {
      return [25 * 888 / 1030, 25 * this.winWidth / 1030, 25];
    },
    advPos() {
      return {
        marginTop: [20 * 888 / 1030, 20 * this.winWidth / 1030, 20],
        marginBottom: [30 * 888 / 1030, 30 * this.winWidth / 1030, 30],
      };
    },
  },
  watch: {
    winWidth(val: number) {
      if (val > 0 && val < 888) {
        this.currentPhase = 0;
      } else if (val >= 888 && val < 1030) {
        this.currentPhase = 1;
      } else if (val >= 1030) {
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
      const a = (max - min) / (1030 - 888);
      const b = min - 888 * a;
      return a * this.winWidth + b;
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
.home-page-container {
  width: 100%;
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
      background-image: linear-gradient(180deg, rgba(255,255,255,0.50) 10%, #E6E6E6 100%);
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
        background: url('../../assets/homePageNoise.jpg');
      }
      .user-content {
        width: auto;
        height: auto;
        display: flex;
        flex-direction: column;
        z-index: 1;
      }
    }
  }
}
</style>
