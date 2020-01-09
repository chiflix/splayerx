<template>
  <div :class="`box ${isDarwin ? 'mac' : 'win' }`">
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
    <div :class="`settingItem ${isDarwin ? 'mac' : 'win' }`">
      <div class="settingItem__title">
        {{ $t('preferences.account.title') }}<span
          @click.left="signOut"
          v-if="!!token"
          class="sign-out"
        >{{ $t('preferences.account.signOut') }}</span>
      </div>
      <div class="settingItem__attached">
        <transition name="fade">
          <div v-if="!token">
            <div class="settingItem__title">
              {{ $t('preferences.account.noToken.title') }}
            </div>
            <div class="settingItem__description">
              {{ $t('preferences.account.noToken.description') }}
            </div>
            <button
              @click.left="signIn"
              class="settingItem__button"
            >
              {{ $t('preferences.account.noToken.button') }}
            </button>
          </div>
        </transition>
        <transition name="fade">
          <div v-if="token">
            <div class="settingItem__box">
              <div class="settingItem__box__left">
                <div class="settingItem__title accontTitle">
                  {{ accountTitle }}
                </div>
                <div class="settingItem__description">
                  {{ accountContent }}
                </div>
              </div>
              <!-- <div
                v-if="!isAPPX"
                class="settingItem__box__right"
              >
                <button
                  v-if="userInfo.isVip"
                  @click.left="goPremium"
                >
                  {{ $t('preferences.account.vipUser.button') }}
                </button>
                <button
                  v-else
                  @click.left="goPremium"
                >
                  {{ $t('preferences.account.normalUser.button') }}
                </button>
              </div> -->
            </div>
            <!-- <div :class="`settingItem__box ${userInfo.isVip ? '' : 'no-margin'}`">
              <div>
                <div class="settingItem__title">
                  {{ $t('preferences.account.createdAt') }}
                </div>
                <div class="settingItem__description">
                  {{ userInfo.createdAt }}
                </div>
              </div>
            </div>
            <div class="settingItem__box">
              <div>
                <div
                  v-if="userInfo.isVip"
                  class="settingItem__title"
                >
                  {{ $t('preferences.account.payAt') }}
                </div>
                <div
                  v-if="userInfo.isVip"
                  class="settingItem__description"
                >
                  <p
                    v-for="(item) in list"
                    :key="item.id"
                  >
                    {{ item.name }}
                  </p>
                </div>
              </div>
            </div> -->
            <div
              class="settingItem__title"
            >
              {{ $t('preferences.account.pointsTitle', { points: userInfo.points }) }}
            </div>
            <div
              v-html="pointsDescription"
              @click="handleBuyPoints"
              class="settingItem__description"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';
import {
  UserInfo as uActions,
} from '@/store/actionTypes';
import { getUserInfo, getUserBalance } from '@/libs/webApis';

export default Vue.extend({
  name: 'Account',
  components: {
  },
  data() {
    return {
      state: 'default',
    };
  },
  computed: {
    ...mapGetters([
      'userInfo', 'token', 'orders',
    ]),
    isDarwin() {
      // @ts-ignore
      return window.isDarwin;
    },
    isMas() {
      // @ts-ignore
      return window.isMAS;
    },
    isAPPX() {
      return process.windowsStore;
    },
    list() {
      return this.orders.map((e: {
        id: string,
        createdAt: string,
        paidAt: string,
        product: {
          duration: {
            unit: string,
            value: number
          }
        }
      }) => {
        const date = new Date(e.paidAt).toISOString().split('T')[0];
        const product = e.product.duration.value > 1
          ? `${e.product.duration.value}${this.$t(`preferences.account.${e.product.duration.unit}s`)}`
          : `${e.product.duration.value}${this.$t(`preferences.account.${e.product.duration.unit}`)}`;
        const payProduct = this.$t('preferences.account.payProduct', { product });
        const name = this.$t('preferences.account.payContent', { date, product: payProduct });
        return {
          id: e.id,
          name,
        };
      });
    },
    accountTitle() {
      let title = '';
      if (!this.userInfo) return title;
      // if (this.userInfo.isVip) {
      //   title = this.$t('preferences.account.vipUser.title');
      // } else {
      //   title = this.$t('preferences.account.normalUser.title');
      // }
      title = this.$t('preferences.account.normalUser.title');
      return `${title}${this.userInfo.displayName}`;
    },
    accountContent() {
      const { userInfo } = this;
      if (!userInfo) return '';
      // if (this.isAPPX) {
      //   return this.$t('preferences.account.normalUser.descriptionAPPX');
      // } if (userInfo.isVip) {
      //   return `${this.$t('preferences.account.vipUser.description')}${userInfo.vipExpiredAt}`;
      // }
      return this.$t('preferences.account.normalUser.registration', { date: userInfo.createdAt });
    },
    pointsDescription() {
      return this.$t('preferences.account.pointsDescription', {
        button: `<span class="buy-points">${this.$t('preferences.account.buyPoints')}</span>`,
      });
    },
  },
  mounted() {
    this.getUserInfo();
    this.getUserBalance();
  },
  methods: {
    ...mapActions({
      updateUserInfo: uActions.UPDATE_USER_INFO,
      updateCallback: uActions.UPDATE_SIGN_IN_CALLBACK,
    }),
    signOut() {
      // @ts-ignore
      window.remote && window.remote.app.emit('sign-out');
    },
    signIn() {
      // @ts-ignore
      window.remote && window.remote.app.emit('sign-out');
      // @ts-ignore
      window.ipcRenderer && window.ipcRenderer.send('add-login', 'preference');
      this.updateCallback(() => { });
    },
    goPremium() {
      // @ts-ignore
      // window.ipcRenderer && window.ipcRenderer.send('add-preference', 'premium');
    },
    async getUserInfo() {
      try {
        const res = await getUserInfo();
        this.updateUserInfo(res.me);
      } catch (error) {
        // empty
      }
    },
    async getUserBalance() {
      try {
        const res = await getUserBalance();
        if (res.translation && res.translation.balance) {
          this.updateUserInfo({
            points: res.translation.balance,
          });
        }
      } catch (error) {
        // empty
      }
    },
    handleClose() {
      // @ts-ignore
      window.ipcRenderer && window.ipcRenderer.send('close-preference');
    },
    handleBuyPoints(e: MouseEvent) {
      // @ts-ignore
      const path = e.path || (e.composedPath && e.composedPath());
      const origin = path.find((e: HTMLElement) => e.tagName === 'SPAN' && e.className.includes('buy-points'));
      if (origin) {
        // @ts-ignore
        window.ipcRenderer && window.ipcRenderer.send('add-preference', 'points');
      }
    },
  },
});
</script>
<style lang="scss" scoped>
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
    z-index: 2;
    .titlebar__button {
      width: 45px;
      height: 36px;
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
.box {
  width: 100%;
  height: 100%;
  &.win {
    height: calc(100% - 36px);
  }
}
.settingItem {
  padding: 32px;
  &.win {
    padding-top: 0;
  }
  &__attached {
    position: relative;
    &>div {
      width: 100%;
      background-color: rgba(0,0,0,0.07);
      margin-top: 15px;
      padding: 20px 28px;
      border-radius: 5px;
      position: absolute;
      box-sizing: border-box;
    }
  }

  &__title {
    font-family: $font-medium;
    font-size: 14px;
    color: rgba(255,255,255,0.7);
    .sign-out {
      color: rgba(255,255,255,0.25);
      letter-spacing: 0;
      font-size: 12px;
      line-height: 16px;
      cursor: pointer;
      margin-left: 8px;
      -webkit-app-region: no-drag;
      &:hover {
        color: rgba(255,255,255,0.7);
      }
    }
  }

  &__description {
    font-family: $font-medium;
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    margin-top: 7px;
    margin-bottom: 7px;
  }

  button {
    width: 100%;
    font-family: $font-medium;
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0;
    text-align: center;
    line-height: 28px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    transition: all 200ms ease-in;
    -webkit-app-region: no-drag;
    &:hover {
      border: 1px solid rgba(255,255,255,0.2);
      background-color: rgba(255,255,255,0.08);
    }
  }
  &__button {
    margin-top: 6px;
  }
  &__box {
    display: flex;
    margin-bottom: 10px;
    &.no-margin {
      margin-bottom: 0;
    }
    span {
      font-size: 11px;
    }
    &__left {
      flex: 1;
      .accontTitle {
        color: rgba(255,255,255,0.7);
        span {
          font-size: 14px;
        }
      }
    }
    &__right {
      display: flex;
      align-items: flex-start;
      padding-left: 10px;
      button {
        min-width: 60px;
        padding-left: 8px;
        padding-right: 8px;
      }
    }
  }
}
</style>
<style lang="scss">
span.buy-points {
  cursor: pointer;
  text-decoration: underline;
  text-underline-position: under;
  &:hover {
    color: rgba(255,255,255,.7);
  }
}
.fade-in {
  visibility: visible;
  opacity: 1;
  transition: opacity 300ms ease-in;
}
.fade-out {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 100ms, opacity 100ms ease-out;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 200ms ease-in;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
