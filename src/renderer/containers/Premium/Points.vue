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
        {{ $t('preferences.points.title') }}
        <span class="points">
          {{ $t('preferences.points.titleLave', { points: userInfo.points }) }}
        </span>
      </div>
      <div
        @click="handleBeVip"
        v-html="description"
        class="settingItem__description"
      />
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
          <div class="product_left">
            <span class="product_points">{{ item.name }}</span>
          </div>
          <div class="product_right">
            <span>{{ item.normalPrice }}</span>
            <span class="product_price_disbale">{{ item.perPrice }}</span>
          </div>
        </li>
      </ul>
      <div
        @click="openService"
        v-html="service"
        class="settingItem__description"
      />
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
            {{ $t('premiumModal.success.pointsContent', { points: userInfo.points }) }}
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
import { mapGetters, mapActions } from 'vuex';
import { getClientUUID, openExternal } from '@/../shared/utils';
import {
  getGeoIP, getProductList, createOrder, ApiError, signIn,
} from '@/libs/webApis';
import Icon from '@/components/BaseIconContainer.vue';
import BaseRadio from '@/components/Preferences/BaseRadio.vue';
import {
  UserInfo as uActions,
} from '@/store/actionTypes';
import { PayStatus } from '@/store/modules/UserInfo';

export default Vue.extend({
  name: 'Points',
  components: {
    BaseRadio,
    Icon,
  },
  data() {
    return {
      state: 'default',
      isCopyed: false,
      payType: 'alipay',
      payList: ['alipay', 'wxpay', 'paypal'],
      orderCreated: false,
    };
  },
  computed: {
    ...mapGetters([
      'webCountryCode', 'token', 'payStatus', 'pointsList', 'userInfo',
    ]),
    isDarwin() {
      // @ts-ignore
      return window.isDarwin;
    },
    isMas() {
      // @ts-ignore
      return window.isMAS;
    },
    isPaying() {
      return this.payStatus === PayStatus.PointsPaying;
    },
    isPaySuccess() {
      return this.payStatus === PayStatus.PointsPaySuccess;
    },
    isPayFail() {
      return this.payStatus === PayStatus.PointsPayFail;
      // return true;
    },
    country() {
      if (this.webCountryCode === 'CN' || !this.webCountryCode) {
        return 'CNY';
      }
      return 'USD';
    },
    description() {
      return this.$t('preferences.points.description');
    },
    service() {
      return this.$t('preferences.points.service');
    },
    isVip() {
      return this.userInfo && this.userInfo.isVip;
    },
    list() {
      let currency = 'USD';
      if (this.isMas) {
        currency = this.webCountryCode !== 'CN' ? 'USD' : 'CNY';
      } else {
        currency = this.payType === 'paypal' ? 'USD' : 'CNY';
      }
      // const { isVip } = this;
      // const map = this.pointsList.reduce((map: object, points: { name: string}) => {
      //   if (!map[points.name]) map[points.name] = [];
      //   map[points.name].push(points);
      //   return map;
      // }, {});
      // const groupList = [];
      // for (const key in map) {
      //   if (map[key]) {
      //     groupList.push(map[key]);
      //   }
      // }
      return this.pointsList.map(
        (product: {
          appleProductID: string,
          currentPrice: {
            CNY: number,
            USD: number,
          },
          originalPrice: {
            CNY: number,
            USD: number,
          },
          duration: {
            value: number,
            unit: string,
            giftValue: number,
            giftUnit: string,
          },
          discount: number,
          id: string,
          vip: boolean,
        }) => {
          const normal = product;
          // const normal = products.find(e => !e.vip);
          // const vip = products.find(e => e.vip);
          // if (normal && vip) {
          if (normal) {
            const name = this.$t(`preferences.points.${normal.duration.unit}`, {
              number: normal.duration.value,
            });
            const normalPriceNumber = normal.currentPrice[currency] / 100;
            const normalPriceString = currency === 'USD'
              ? normalPriceNumber.toFixed(2) : normalPriceNumber.toFixed(0);
            // const normalPrice = this.$t('preferences.points.origin', {
            //   price: `${normalPriceString} ${currency}`,
            // });
            const normalPrice = `${normalPriceString} ${currency}`;
            // const vipPriceNumber = vip.currentPrice[currency] / 100;
            // const vipPriceString = currency === 'USD'
            //   ? vipPriceNumber.toFixed(2) : vipPriceNumber.toFixed(0);
            // const vipPrice = this.$t('preferences.points.premium', {
            //   price: `${vipPriceString} ${currency}`,
            // });
            // const perPriceNumber = (isVip
            //   ? vipPriceNumber : normalPriceNumber) / normal.duration.value;
            const perPriceNumber = normalPriceNumber / normal.duration.value;
            const perPriceString = currency === 'USD'
              ? perPriceNumber.toFixed(3) : perPriceNumber.toFixed(2);
            const perPrice = this.$t(`preferences.points.${normal.duration.unit}Per`, {
              price: `${perPriceString} ${currency}`,
            });
            return {
              normalID: normal.id,
              // vipID: vip.id,
              normalAppleProductID: normal.appleProductID,
              // vipAppleProductID: vip.appleProductID,
              normalPrice,
              // vipPrice,
              perPrice,
              name,
            };
          }
          return null;
        },
      );
    },
  },
  watch: {
    webCountryCode(v: string) {
      if (v === 'CN' || !v) {
        this.payType = 'alipay';
        this.payList = ['alipay', 'wxpay', 'paypal'];
      } else {
        this.payType = 'paypal';
        this.payList = ['paypal', 'alipay', 'wxpay'];
      }
    },
  },
  async mounted() {
    // get products
    try {
      const pointsList = await getProductList('translation');
      this.updatePointsList(pointsList);
    } catch (error) {
      // empty
    }
  },
  methods: {
    ...mapActions({
      updatePointsList: uActions.UPDATE_POINTS_LIST,
      updateSignInCallBack: uActions.UPDATE_SIGN_IN_CALLBACK,
      updatePayStatus: uActions.UPDATE_PAY_STATUS,
    }),
    async openService(evt: MouseEvent) {
      if ((evt.target as HTMLElement).tagName !== 'A') return;
      evt.preventDefault();
      const { countryCode } = await getGeoIP();
      const url = countryCode === 'CN' ? 'https://shooter.cn' : 'https://sagittarius.ai';
      openExternal(url);
    },
    cnOff(num: number) {
      return (num % 10 === 0) ? (num / 10) : num;
    },
    buy(item: {
      normalID: string,
      // vipID: string,
      normalAppleProductID: string,
      // vipAppleProductID: string,
    }) {
      // const { isVip } = this;
      // @ts-ignore
      const ipcRenderer = window.ipcRenderer;
      // @ts-ignore
      const remote = window.remote;
      if (!this.token) {
        remote && remote.app.emit('sign-out');
        // eslint-disable-next-line
        if (!this.isMas || !window.confirm(this.$i18n.t('preferences.points.guestWarning'))) {
          ipcRenderer && ipcRenderer.send('add-login', 'preference');
        } else {
          getClientUUID().then(async (clientUUID) => {
            await signIn('guest', clientUUID, '');
          });
        }
        // sign in callback
        this.updateSignInCallBack(() => {
          this.buy(item);
        });
        return;
      }
      if (this.isPaying) return;
      this.updatePayStatus(PayStatus.PointsPaying);
      // const id = isVip ? item.vipID : item.normalID;
      // const appleProductID = isVip ? item.vipAppleProductID : item.normalAppleProductID;
      const id = item.normalID;
      const appleProductID = item.normalAppleProductID;
      if (this.isMas) {
        ipcRenderer && ipcRenderer.send('create-order-loading', 'points');
        remote && remote.app.applePay(
          appleProductID,
          id,
          this.country,
          1,
          (isProductValid: boolean) => {
            if (!isProductValid) {
              this.updatePayStatus(PayStatus.PremiumPayFail);
              ipcRenderer && ipcRenderer.send('create-order-done');
            }
          },
        );
      } else {
        this.orderCreated = false;
        const channel = this.payType;
        const currency = this.payType === 'paypal' ? 'USD' : 'CNY';
        ipcRenderer && ipcRenderer.send('create-order-loading', 'points');
        createOrder({
          channel,
          currency,
          productID: id,
        })
          .then((res: { url: string, orderID: string }) => {
            ipcRenderer && ipcRenderer.send('add-payment', {
              channel,
              url: window.btoa(res.url),
              orderID: res.orderID,
            });
            this.orderCreated = true;
          })
          .catch((error: ApiError) => {
            this.updatePayStatus(PayStatus.PointsPayFail);
            if (error && (error.status === 400 || error.status === 401 || error.status === 403)) {
              // sign in callback
              this.updateSignInCallBack(() => {
                this.buy(item);
              });
              remote && remote.app.emit('sign-out');
              ipcRenderer && ipcRenderer.send('add-login', 'preference');
            } else {
              this.updatePayStatus(PayStatus.PremiumPayFail);
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
      this.updatePayStatus(PayStatus.Default);
      this.isCopyed = false;
    },
    goAccount() {
      this.closePay();
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
    handleBeVip(e: MouseEvent) {
      // @ts-ignore
      const path = e.path || (e.composedPath && e.composedPath());
      const origin = path.find((e: HTMLElement) => e.tagName === 'SPAN' && e.className.includes('be-vip'));
      if (origin) {
        // @ts-ignore
        // window.ipcRenderer && window.ipcRenderer.send('add-preference', 'premium');
      }
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
  // &::-webkit-scrollbar {
  //   width: 8px;
  //   background-color: transparent;
  // }
  // &::-webkit-scrollbar-thumb {
  //   border-radius: 4px;
  //   background-color: rgba(255,255,255,0.2);
  // }
  // &::-webkit-scrollbar-track {
  //   border-radius: 4px;
  //   background-color: transparent;
  // }
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
    span.points {
      color: rgba(255,255,255,0.25);
      letter-spacing: 0;
      font-size: 12px;
      line-height: 16px;
      margin-left: 8px;
    }
  }

  &__description {
    font-family: $font-medium;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.25);
    margin-top: 7px;
    margin-bottom: 20px;
  }

  &__description ::v-deep a {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  }

  &__functionList {
    display: flex;
    margin-bottom: 25px;
    ul {
      flex: 1;
      padding-left: 16px
    }
    li {
      font-family: $font-medium;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0;
      list-style-position: outside;
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
    margin-bottom: 15px;
    li {
      font-family: $font-medium;
      -webkit-app-region: no-drag;
      padding: 8px 15px;
      list-style: none;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 200ms ease-in;
      border: 1px solid transparent;
      border-radius: 2px;
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }
      &:last-child {
        margin-bottom: 0;
      }
    }
    .product_left, .product_right {
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      line-height: 18px;
      letter-spacing: 0;
    }
    .product_left {
      text-align: left;
      em {
        font-style: normal;
        color: rgba(255, 255, 255, 0.9);
      }
    }
    .product_right {
      text-align: right;
    }
    .product_points {
      line-height: 22px;
      font-size: 16px;
      // font-weight: medium;
    }
    .product_price_disbale {
      color: rgba(255,255,255,0.25);
      // text-decoration: line-through;
      // text-decoration-color: rgba(95,95,95,1);
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

.success-up4-enter-active {
  animation: successUp 0.3s;
  animation-delay: 1.5s;
  opacity: 0;
}

.success-up5-enter-active {
  animation: successUp 0.3s;
  animation-delay: 1.8s;
  opacity: 0;
}

.success-up6-enter-active {
  animation: successUp 0.3s;
  animation-delay: 2.1s;
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
<style lang="scss">
span.be-vip {
  text-decoration: underline;
  cursor: pointer;
  -webkit-app-region: no-drag;
  text-underline-position: under;
  text-decoration-skip-ink: none;
  text-decoration-color: rgba(95,95,95,1);
  &:hover {
    color: rgba(255,255,255,.7);
    text-decoration-color: rgba(255,255,255,.7);
  }
}
</style>
