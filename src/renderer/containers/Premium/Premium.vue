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
      <div class="bottom-mark" />
      <div class="settingItem__title">
        {{ $t('preferences.premium.title') }}
      </div>
      <div class="settingItem__description">
        {{ $t('preferences.premium.description') }}
      </div>
      <div
        v-if="isCNLanguage"
        class="settingItem__functionList"
      >
        <ul>
          <li>{{ $t('preferences.premium.content.description1') }}</li>
          <li>{{ $t('preferences.premium.content.description2') }}</li>
          <li>{{ $t('preferences.premium.content.description3') }}</li>
        </ul>
        <ul>
          <li>{{ $t('preferences.premium.content.description4') }}</li>
          <li>{{ $t('preferences.premium.content.description6') }}</li>
        </ul>
      </div>
      <div
        v-else
        class="settingItem__functionList"
      >
        <ul>
          <li>{{ $t('preferences.premium.content.description1') }}</li>
          <li>{{ $t('preferences.premium.content.description2') }}</li>
          <li>{{ $t('preferences.premium.content.description3') }}</li>
          <li>{{ $t('preferences.premium.content.description6') }}</li>
        </ul>
      </div>
      <div
        v-if="!isMas"
        class="settingItem__payList"
      >
        <div
          v-for="(item) in payList"
          :key="item"
        >
          <BaseRadio
            v-model="payType"
            :value="item"
          >
            {{ $t(`preferences.premium.payType.${item}`) }}
          </BaseRadio>
        </div>
      </div>
      <ul class="settingItem__productionList">
        <li
          @click.left="buy(item)"
          v-for="(item) in list"
          :key="item.id"
        >
          <div>
            {{ item.duration }}
          </div>
          <p>{{ item.current }}</p>
          <span>{{ item.gift }}</span>
        </li>
      </ul>
      <div class="settingItem__title">
        {{ $t('preferences.premium.explanation.title') }}
      </div>
      <div class="settingItem__description no-margin">
        <p>
          {{ $t('preferences.premium.explanation.description1') }}
        </p>
        <br>
        <p>
          {{ $t('preferences.premium.explanation.description2') }}
        </p>
        <br>
        <p>
          {{ $t('preferences.premium.explanation.description6') }}
        </p>
        <br>
        <p>
          {{ $t('preferences.premium.explanation.description3') }}
        </p>
        <br>
        <p>
          {{ $t('preferences.premium.explanation.description4') }}
        </p>
        <p>
          {{ $t('preferences.premium.explanation.description5') }}
        </p>
      </div>
    </div>
    <div
      v-fade-in="isPaying || isPaySuccess || isPayFail"
      class="modal"
    >
      <div class="mask" />
      <transition name="background1">
        <img
          v-if="isPaySuccess"
          class="success-background1"
          src="../../assets/payment-success-background1.svg"
        >
      </transition>
      <transition name="background2">
        <img
          v-if="isPaySuccess"
          class="success-background2"
          src="../../assets/payment-success-background2.svg"
        >
      </transition>
      <transition name="left-icon1">
        <img
          v-if="isPaySuccess"
          class="success-icon1"
          src="../../assets/payment-success-icon2.svg"
        >
      </transition>
      <transition name="right-icon1">
        <img
          v-if="isPaySuccess"
          class="success-icon3"
          src="../../assets/payment-success-icon3.svg"
        >
      </transition>
      <transition name="right-icon2">
        <div
          v-if="isPaySuccess"
          class="success-icon4"
        />
      </transition>
      <div
        v-fade-in="isPaySuccess"
        class="success-box"
      >
        <transition name="success-scale">
          <div v-if="isPaySuccess">
            <h2>
              {{ $t('premiumModal.success.h2') }}
            </h2>
            <h1>
              {{ $t('premiumModal.success.h1') }}
            </h1>
            <h4>
              {{ $t('premiumModal.success.h4') }}
            </h4>
          </div>
        </transition>
        <transition name="success-up1">
          <p v-if="isPaySuccess">
            {{ $t('premiumModal.success.content1') }}
          </p>
        </transition>
        <transition name="success-up2">
          <p v-if="isPaySuccess">
            {{ $t('premiumModal.success.content2') }}
          </p>
        </transition>
        <transition name="success-up3">
          <p v-if="isPaySuccess">
            {{ $t('premiumModal.success.content3') }}
          </p>
        </transition>
        <transition name="success-fade">
          <button
            v-if="isPaySuccess"
            @click.left="goAccount"
          >
            {{ $t('premiumModal.success.button') }}
          </button>
        </transition>
      </div>
      <div
        v-fade-in="isPaying"
        class="loading-box"
      >
        <div>
          <div class="loader">
            <Icon type="loading" />
          </div>
        </div>
        <p>{{ $t('premiumModal.loading.content') }}</p>
        <button @click.left="cancelPay">
          {{ $t('premiumModal.loading.button') }}
        </button>
      </div>
      <div
        v-fade-in="isPayFail"
        class="fail-box"
      >
        <h1>{{ $t('premiumModal.fail.h1') }}</h1>
        <p>{{ $t('premiumModal.fail.content') }}</p>
        <h5>
          support@splayer.org
          <span
            @click.left="copy"
            :class="isCopyed ? '' : 'canHover'"
          >{{ isCopyed ? $t('premiumModal.fail.copied') : $t('premiumModal.fail.copy') }}</span>
        </h5>
        <button @click.left="closePay">
          {{ $t('premiumModal.fail.button') }}
        </button>
      </div>
    </div>
    <div class="load-icons">
      <img src="../../assets/payment-success-icon1.svg">
      <img src="../../assets/payment-success-icon2.svg">
      <img src="../../assets/payment-success-icon3.svg">
      <img src="../../assets/payment-success-background1.svg">
      <img src="../../assets/payment-success-background2.svg">
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import {
  getGeoIP, getProductList, createOrder, ApiError, setToken,
} from '@/libs/webApis';
import Icon from '@/components/BaseIconContainer.vue';
import BaseRadio from '@/components/Preferences/BaseRadio.vue';

export default Vue.extend({
  name: 'Premium',
  components: {
    BaseRadio,
    Icon,
  },
  data() {
    return {
      state: 'default',
      isPaying: false,
      isPaySuccess: false,
      isPayFail: false,
      isCopyed: false,
      payType: 'alipay',
      payList: ['alipay', 'wxpay', 'paypal'],
      countryCode: 'CN',
      premiumList: [],
      token: '',
      signInCallback: null,
      orderCreated: false,
      lang: '',
    };
  },
  computed: {
    isDarwin() {
      // @ts-ignore
      return window.isDarwin;
    },
    isMas() {
      // @ts-ignore
      return window.isMAS;
    },
    isCNLanguage() {
      // @ts-ignore
      const lang = this.lang || window.displayLanguage;
      if (!lang) {
        return true;
      }
      return lang.indexOf('zh') > -1;
    },
    country() {
      if (this.countryCode === 'CN' || !this.countryCode) {
        return 'CNY';
      }
      return 'USD';
    },
    list() {
      const country = this.payType === 'paypal' ? 'USD' : 'CNY';
      return this.premiumList.map(
        (e: {
          appleProductID: string;
          currentPrice: {
            CNY: number;
            USD: number;
          };
          originalPrice: {
            CNY: number;
            USD: number;
          };
          duration: {
            value: number;
            unit: string;
            giftValue: number;
            giftUnit: string;
          };
          discount: number,
          id: string;
        }) => {
          const currentPrice = e.currentPrice[country] / 100;
          const currentPriceString = country === 'USD' ? currentPrice.toFixed(2) : currentPrice.toFixed(0);
          const current = `${currentPriceString} ${country}`;
          const duration = e.duration.value > 1
            ? this.$t(`preferences.premium.${e.duration.unit}s`, { num: e.duration.value })
            : this.$t(`preferences.premium.${e.duration.unit}`, { num: e.duration.value });
          let gift = '';
          if (e.duration.giftValue === 0) {
            gift = this.$t('preferences.premium.normal');
          } else if (e.duration.giftValue === 1) {
            gift = this.$t(`preferences.premium.gift${e.duration.giftUnit}`, { num: e.duration.giftValue });
          } else {
            gift = this.$t(`preferences.premium.gift${e.duration.giftUnit}s`, { num: e.duration.giftValue });
          }
          return {
            id: e.id,
            appleProductID: e.appleProductID,
            current,
            gift,
            duration,
          };
        },
      );
    },
  },
  watch: {
    country(val: string) {
      if (val === 'CNY') {
        this.payType = 'alipay';
        this.payList = ['alipay', 'wxpay', 'paypal'];
      } else if (val === 'USD') {
        this.payType = 'paypal';
        this.payList = ['paypal', 'alipay', 'wxpay'];
      }
    },
  },
  async mounted() {
    try {
      // @ts-ignore
      const userInfo = window.remote && window.remote.getGlobal('account');
      if (userInfo && userInfo.token) {
        this.token = userInfo.token;
        setToken(userInfo.token);
      }
    } catch (error) {
      // empty
    }
    getGeoIP().then((res: {
      countryCode: string,
    }) => {
      this.countryCode = res.countryCode;
      if (this.countryCode === 'CN' || !this.countryCode) {
        this.payType = 'alipay';
        this.payList = ['alipay', 'wxpay', 'paypal'];
      } else {
        this.payType = 'paypal';
        this.payList = ['paypal', 'alipay', 'wxpay'];
      }
    }).catch(() => {
      // empty
    });
    // get products
    try {
      this.premiumList = await getProductList();
    } catch (error) {
      // empty
    }
    // @ts-ignore
    const ipcRenderer = window.ipcRenderer;
    if (ipcRenderer) {
      // @ts-ignore
      ipcRenderer && ipcRenderer.on('setPreference', (event: Event, data: {
        displayLanguage: string,
      }) => {
        if (data && data.displayLanguage) {
          this.lang = data.displayLanguage;
        }
      });
      // sign in success
      ipcRenderer.on('sign-in', (e: Event, account: {
        token: string,
      }) => {
        if (account && account.token) {
          this.token = account.token;
          setToken(account.token);
          // sign in success, callback
          if (this.signInCallback) {
            this.signInCallback();
            this.signInCallback = () => {};
          }
        } else {
          this.token = '';
          setToken('');
        }
      });
      ipcRenderer.on('applePay-success', () => {
        this.isPaying = false;
        this.isPaySuccess = true;
        this.isPayFail = false;
        ipcRenderer && ipcRenderer.send('create-order-done');
      });
      ipcRenderer.on('applePay-fail', () => {
        this.isPaying = false;
        this.isPaySuccess = false;
        this.isPayFail = true;
        ipcRenderer && ipcRenderer.send('create-order-done');
      });
      ipcRenderer.on('close-payment', () => {
        this.closePay();
      });
      ipcRenderer.on('payment-success', () => {
        setTimeout(() => {
          this.isPaying = false;
          this.isPaySuccess = true;
          this.isPayFail = false;
        }, 800);
        // update userInfo
      });
      ipcRenderer.on('payment-fail', () => {
        this.isPaying = false;
        this.isPaySuccess = false;
        this.isPayFail = true;
      });
    }
  },
  methods: {
    cnOff(num: number) {
      return (num % 10 === 0) ? (num / 10) : num;
    },
    buy(item: {
      id: string;
      appleProductID: string;
      currentPrice: string;
      originalPrice: string;
    }) {
      // @ts-ignore
      const ipcRenderer = window.ipcRenderer;
      // @ts-ignore
      const remote = window.remote;
      if (!this.token) {
        remote && remote.app.emit('sign-out');
        ipcRenderer && ipcRenderer.send('add-login', 'preference');
        // sign in callback
        this.signInCallback = () => {
          this.buy(item);
        };
        return;
      }
      if (this.isPaying) return;
      this.isPaying = true;
      if (this.isMas) {
        ipcRenderer && ipcRenderer.send('create-order-loading');
        remote && remote.app.applePay(
          item.appleProductID,
          item.id,
          this.country,
          1,
          (isProductValid: boolean) => {
            if (!isProductValid) {
              this.isPaying = false;
              this.isPaySuccess = false;
              this.isPayFail = true;
              ipcRenderer && ipcRenderer.send('create-order-done');
            }
          },
        );
      } else {
        this.orderCreated = false;
        const channel = this.payType;
        const currency = this.payType === 'paypal' ? 'USD' : 'CNY';
        ipcRenderer && ipcRenderer.send('create-order-loading');
        createOrder({
          channel,
          currency,
          productID: item.id,
        })
          .then((res: { url: string; orderID: string }) => {
            ipcRenderer && ipcRenderer.send('add-payment', {
              channel,
              url: window.btoa(res.url),
              orderID: res.orderID,
            });
            this.orderCreated = true;
          })
          .catch((error: ApiError) => {
            this.isPaying = false;
            if (error && (error.status === 400 || error.status === 401 || error.status === 403)) {
              // sign in callback
              this.signInCallback = () => {
                this.buy(item);
              };
              remote && remote.app.emit('sign-out');
              ipcRenderer && ipcRenderer.send('add-login', 'preference');
            } else {
              this.isPayFail = true;
            }
            ipcRenderer && ipcRenderer.send('create-order-done');
          });
      }
    },
    cancelPay() {
      if (this.orderCreated || this.isMas) {
        this.closePay();
        // @ts-ignore
        window.ipcRenderer && window.ipcRenderer.send('close-payment');
      }
    },
    closePay() {
      this.isPayFail = false;
      this.isPaying = false;
      this.isPaySuccess = false;
      this.isCopyed = false;
    },
    goAccount() {
      this.closePay();
      // @ts-ignore
      window.ipcRenderer && window.ipcRenderer.send('add-preference', 'account');
    },
    copy() {
      this.isCopyed = true;
      // @ts-ignore
      window.clipboard && window.clipboard.writeText('support@splayer.org');
    },
    handleClose() {
      // @ts-ignore
      window.ipcRenderer && window.ipcRenderer.send('close-preference');
    },
  },
});
</script>
<style lang="scss" scoped>
.load-icons {
  width: 0px;
  height: 0px;
  overflow: hidden;
}
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
  overflow-y: scroll;
  &::-webkit-scrollbar {
    width: 8px;
    background-color: transparent;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(255,255,255,0.2);
  }
  &::-webkit-scrollbar-track {
    border-radius: 4px;
    background-color: transparent;
  }
  &.win {
    height: calc(100% - 36px);
  }
}
.settingItem {
  padding: 32px;
  -webkit-app-region: no-drag;
  &.win {
    padding-top: 0;
  }
  .bottom-mark {
    width: calc(100% - 8px);
    height: 20px;
    position: fixed;
    left: 0;
    bottom: 0;
    background: linear-gradient(transparent, #3B3B41)
  }
  &__attached {
    background-color: rgba(0, 0, 0, 0.07);
    margin-top: 15px;
    padding: 20px 28px;
    border-radius: 5px;
  }

  &__title {
    font-family: $font-medium;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }

  &__description {
    font-family: $font-medium;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.25);
    margin-top: 7px;
    margin-bottom: 20px;
    &.no-margin {
      margin-bottom: 0;
    }
  }

  &__functionList {
    display: flex;
    margin-bottom: 25px;
    ul {
      flex: 1;
    }
    li {
      font-family: $font-medium;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0;
      list-style-position: inside;
      margin-bottom: 5px;
    }
  }
  &__payList {
    display: flex;
    margin-bottom: 20px;
    justify-content: space-between;
    & > div {
      width: 110px;
    }
    .radio {
      display: inline-block;
    }
  }
  &__productionList {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    li {
      -webkit-app-region: no-drag;
      width: 110px;
      list-style: none;
      text-align: center;
      background: rgba(0, 0, 0, 0.05);
      padding-top: 29px;
      padding-bottom: 16px;
      cursor: pointer;
      transition: all 200ms ease-in;
      border: 1px solid transparent;
      border-radius: 2px;
      line-height: 0;
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }
    }
    div {
      font-size: 24px;
      line-height: 33px;
      margin-bottom: 7px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 300;
      span {
        font-family: $font-normal;
        font-size: 15px;
      }
    }
    p {
      font-family: $font-medium;
      font-size: 11px;
      line-height: 16px;
      margin-bottom: 2px;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 0;
    }
    span {
      font-family: $font-medium;
      font-size: 12px;
      line-height: 17px;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0;
    }
    i {
      font-style: normal;
      margin: 0 2px;
    }
  }
}
.modal {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  .mask {
    width: 100%;
    height: 100%;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 2;
    background-color: rgba(0, 0, 0, 0.9);
  }
  button {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    font-family: $font-medium;
    font-size: 11px;
    letter-spacing: 0;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    text-align: center;
    line-height: 28px;
    outline: none;
    cursor: pointer;
    transition: all 200ms ease-in;
    padding: 0 12px;
    -webkit-app-region: no-drag;
    &:hover {
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.08);
    }
  }
}
.loading-box {
  width: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
  font-family: $font-medium;
  & > div {
    width: 115px;
    height: 115px;
    margin: 0 auto 11px;
  }
  .loader {
    width: 100%;
    height: 100%;
    -webkit-animation: load3 1.4s infinite linear;
    animation: load3 1.4s infinite linear;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    color: rgba(255, 255, 255, 0.7);
    svg {
      width: 100%;
      height: 100%;
    }
  }
  p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: -0.3px;
    line-height: 13px;
    margin-bottom: 30px;
  }
}
.fail-box {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
  font-family: $font-medium;
  h1 {
    font-size: 35px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    text-align: center;
    line-height: 35px;
    margin-bottom: 18px;
  }
  p {
    width: 300px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    line-height: 13px;
    margin-bottom: 15px;
  }
  h5 {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    text-align: center;
    line-height: 15px;
    margin-bottom: 30px;
    span {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 0;
      text-align: center;
      line-height: 11px;
      &.canHover {
        &:hover {
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  }
}
.success-box {
  width: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
  font-family: $font-medium;
  h2 {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    text-align: center;
    line-height: 13px;
    margin-bottom: 10px;
  }
  h1 {
    font-size: 35px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    text-align: center;
    line-height: 35px;
    margin-bottom: 12px;
  }
  h4 {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.2);
    letter-spacing: 0;
    text-align: center;
    line-height: 13px;
    margin-bottom: 15px;
  }
  p {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0;
    line-height: 11px;
    margin-bottom: 15px;
  }
}
.success-background1 {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}
.success-background2 {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
}
.success-icon1 {
  width: 8px;
  height: 13px;
  position: absolute;
  left: 90px;
  top: 54px;
  z-index: 3;
}
.success-icon2 {
  width: 13px;
  height: 19px;
  position: absolute;
  left: 85px;
  top: 71px;
  z-index: 3;
}
.success-icon3 {
  width: 59px;
  height: 59px;
  position: absolute;
  left: 398px;
  top: 247px;
  z-index: 3;
}
.success-icon4 {
  width: 48px;
  height: 5px;
  position: absolute;
  left: 350px;
  top: 362px;
  z-index: 3;
  background: rgba(255, 255, 255, 0.20);
  opacity: 0.5;
}
@-webkit-keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
.background1-enter-active {
  animation: bounce-in 0.3s;
  animation-delay: 0.3s;
  opacity: 0;
}
.background2-enter-active {
  animation: bounce-in2 0.3s;
  animation-delay: 0.3s;
  opacity: 0;
}
.left-icon1-enter-active {
  animation: left-icon1 0.3s;
  animation-delay: 0.3s;
  opacity: 0;
}
.left-icon2-enter-active {
  animation: left-icon2 0.5s;
  animation-delay: 0.3s;
  opacity: 0;
}
.right-icon1-enter-active {
  animation: right-icon1 0.3s;
  animation-delay: 0.3s;
  opacity: 0;
}
.right-icon2-enter-active {
  animation: right-icon2 0.3s;
  animation-delay: 0.3s;
  opacity: 0;
}
@keyframes left-icon1 {
  0% {
    opacity: 0;
    transform: translateX(1600%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes left-icon2 {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes right-icon1 {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes right-icon2 {
  0% {
    width: 100px;
  }
  100% {
    width: 48px;
  }
}
@keyframes bounce-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes bounce-in2 {
  0% {
    width: 40%;
    height: 40%;
    opacity: 0;
  }
  100% {
    width: 100%;
    height: 100%;
    opacity: 1;
  }
}

.success-scale-enter-active {
  animation: successScale 0.3s;
  animation-delay: 0.3s;
  opacity: 0;
}

.success-up1-enter-active {
  animation: successUp 0.3s;
  animation-delay: 0.6s;
  opacity: 0;
}

.success-up2-enter-active {
  animation: successUp 0.3s;
  animation-delay: 0.9s;
  opacity: 0;
}

.success-up3-enter-active {
  animation: successUp 0.3s;
  animation-delay: 1.2s;
  opacity: 0;
}

.success-fade-enter-active {
  animation: successFade 0.3s;
  animation-delay: 1.5s;
  opacity: 0;
}

@keyframes successScale {
  0% {
    opacity: 0;
    transform: scale(0.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes successUp {
  0% {
    opacity: 0;
    transform: translateY(200%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes successFade {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
