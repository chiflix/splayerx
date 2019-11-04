<template>
  <div class="home-page-container">
    <div
      :style="{
        left: winWidth - (showSidebar ? 0 : 76) > 1744 ? '50%' : '',
        transform: winWidth - (showSidebar ? 0 : 76) > 1744 ? 'translateX(-50%)' : '',
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
            margin: `${userPos[currentPhase]}px 0 0 ${userPos[currentPhase]}px`,
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
      return this.calcSize(732, 992);
    },
    calcHeight() {
      return this.calcSize(232, 314);
    },
    calcMargin() {
      return [29.5, this.calcSize(29.5, 30), 40];
    },
    titlePos() {
      return {
        marginLeft: [40 * 857 / 1148, 40 * this.winWidth / 1148, 40],
        marginTop: [56 * 857 / 1148, 56 * this.winWidth / 1148, 56],
      };
    },
    titleSize() {
      return [44 * 857 / 1148, 44 * this.winWidth / 1148, 44];
    },
    userPos() {
      return [40 * 857 / 1148, 40 * this.winWidth / 1148, 40];
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
      return [360 * 857 / 1148, 360 * this.winWidth / 1148, 360];
    },
    logoPos() {
      return {
        top: [36.8 * 857 / 1148, 36.8 * this.winWidth / 1148, 36.8],
        right: [-50 * 857 / 1148, -50 * this.winWidth / 1148, -50],
      };
    },
    versionSize() {
      return [14, this.calcSize(14, 19), 19];
    },
    versionPos() {
      return {
        bottom: [48 * 857 / 1148, 48 * this.winWidth / 1148, 48],
        right: [50 * 857 / 1148, 50 * this.winWidth / 1148, 50],
      };
    },
    advHeight() {
      return [107, this.calcSize(107, 144), 144];
    },
    playlistFontSize() {
      return [25 * 857 / 1148, 25 * this.winWidth / 1148, 25];
    },
    advPos() {
      return {
        marginTop: [20 * 857 / 1148, 20 * this.winWidth / 1148, 20],
        marginBottom: [50 * 857 / 1148, 50 * this.winWidth / 1148, 50],
      };
    },
  },
  watch: {
    winWidth(val: number) {
      if (val > 0 && val < 857) {
        this.currentPhase = 0;
      } else if (val >= 857 && val < 1148) {
        this.currentPhase = 1;
      } else if (val >= 1148) {
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
      const a = (max - min) / (1148 - 857);
      const b = min - 857 * a;
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
  overflow: scroll;
  .home-page-content {
    width: auto;
    height: auto;
    overflow: scroll;
    display: flex;
    flex-direction: column;
    position: absolute;
    max-width: 1744px;
    .account-content {
      position: relative;
      width: 100%;
      height: auto;
      min-width: 732px;
      min-height: 232px;
      border-radius: 7px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      max-width: 1664px;
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
