<template>
  <div class="settingItem">
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
        <li>{{ $t('preferences.premium.content.description5') }}</li>
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
        <li>{{ $t('preferences.premium.content.description4') }}</li>
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
          {{ item.currentPrice.int }}<span
            v-if="payType === 'paypal'"
          >.{{ item.currentPrice.float }}</span>
        </div>
        <p>{{ item.origin }}</p>
        <span>{{ item.discount }}<i v-if="item.discount">/</i>{{ item.duration }}</span>
      </li>
    </ul>
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
      <transition name="left-icon2">
        <img
          v-if="isPaySuccess"
          class="success-icon2"
          src="../../assets/payment-success-icon1.svg"
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
        <button @click.left="closePay">
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
import { remote, ipcRenderer, clipboard } from 'electron';
import {
  applePay, getProductList, createOrder, ApiError, getUserInfo,
} from '@/libs/apis';
import { UserInfo as uActions } from '@/store/actionTypes';
import Icon from '@/components/BaseIconContainer.vue';
import BaseRadio from './BaseRadio.vue';
import { log } from '../../libs/Log';

export default Vue.extend({
  name: 'Premium',
  components: {
    BaseRadio,
    Icon,
  },
  data() {
    return {
      isPaying: false,
      isApplePaing: false,
      isPaySuccess: false,
      isPayFail: false,
      isCopyed: false,
      payType: '',
      payList: [],
    };
  },
  computed: {
    ...mapGetters(['countryCode', 'displayLanguage', 'premiumList', 'token']),
    isMas() {
      return !!process.mas;
    },
    isCNLanguage() {
      return this.displayLanguage.indexOf('zh') > -1;
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
          };
          discount: number,
          id: string;
        }) => {
          const currentPrice = (e.currentPrice[country] / 100).toFixed(2).split('.');
          let originalPrice = (e.originalPrice[country] / 100).toFixed(2);
          if (
            e.originalPrice[country]
            === parseInt(originalPrice, 10) * 100
          ) {
            originalPrice = (e.originalPrice[country] / 100).toFixed(0);
          }
          const off = this.isCNLanguage ? e.discount : 100 - e.discount;
          const originString = e.discount === 100 ? '' : `${this.$t('preferences.premium.origin')}${originalPrice}`;
          const origin = `${originString} ${country}`;
          const discount = e.discount === 100 ? '' : `${off}${this.$t('preferences.premium.off')}`;
          const duration = e.duration.value > 1
            ? `${e.duration.value} ${this.$t(`preferences.premium.${e.duration.unit}s`)}`
            : `${e.duration.value} ${this.$t(`preferences.premium.${e.duration.unit}`)}`;
          return {
            id: e.id,
            appleProductID: e.appleProductID,
            currentPrice: {
              int: currentPrice[0],
              float: currentPrice[1],
            },
            originalPrice,
            origin,
            off,
            discount,
            duration,
          };
        },
      );
    },
  },
  watch: {
    displayLanguage(val: string) {
      if (val) this.$i18n.locale = val;
    },
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
    this.payType = this.country === 'USD' ? 'paypal' : 'alipay';
    this.payList = this.country === 'USD' ? ['paypal', 'alipay', 'wxpay'] : ['alipay', 'wxpay', 'paypal'];
    try {
      const productList = await getProductList();
      this.updatePremiumList(productList);
    } catch (error) {
      // empty
    }
    ipcRenderer.on(
      'applePay-success',
      async (
        e: Event,
        payment: {
          id: string;
          productID: string;
          transactionID: string;
          receipt: Buffer;
        },
      ) => {
        this.appleBuy(payment);
      },
    );
    ipcRenderer.on('applePay-fail', (e: Event, fail: string) => {
      log.debug('applePay', fail);
      this.isPaying = false;
      this.isPaySuccess = false;
      this.isPayFail = true;
    });
    ipcRenderer.on('close-payment', () => {
      this.closePay();
    });
    ipcRenderer.on('payment-success', () => {
      setTimeout(() => {
        this.isPaying = false;
        this.isPaySuccess = true;
        this.isPayFail = false;
        this.getUserInfo();
      }, 800);
      // update userInfo
    });
    ipcRenderer.on('payment-fail', () => {
      this.isPaying = false;
      this.isPaySuccess = false;
      this.isPayFail = true;
    });
  },
  methods: {
    ...mapActions({
      updatePremiumList: uActions.UPDATE_PREMIUM,
      updateCallback: uActions.UPDATE_SIGN_IN_CALLBACK,
      updateUserInfo: uActions.UPDATE_USER_INFO,
    }),
    async appleBuy(payment: {
      id: string;
      productID: string;
      transactionID: string;
      receipt: Buffer;
    }) {
      if (this.isApplePaing) return;
      this.isApplePaing = true;
      try {
        await applePay({
          currency: this.country,
          productID: payment.id,
          transactionID: payment.transactionID,
          receipt: payment.receipt.toString('base64'),
        });
        this.isPaying = false;
        this.isPaySuccess = true;
        this.isPayFail = false;
        this.isApplePaing = false;
        ipcRenderer.send('payment-success-apple-verify');
      } catch (error) {
        this.isApplePaing = false;
        if (error && (error.status === 400 || error.status === 401 || error.status === 403)) {
          // sign in callback
          this.updateCallback(() => {
            this.appleBuy(payment);
          });
          remote.app.emit('sign-out');
          ipcRenderer.send('add-login', 'preference');
        } else {
          this.isPaying = false;
          this.isPaySuccess = false;
          this.isPayFail = true;
        }
      }
    },
    buy(item: {
      id: string;
      appleProductID: string;
      currentPrice: string;
      originalPrice: string;
    }) {
      if (!this.token) {
        remote.app.emit('sign-out');
        ipcRenderer.send('add-login', 'preference');
        return;
      }
      if (this.isPaying) return;
      this.isPaying = true;
      if (this.isMas) {
        // @ts-ignore
        remote.app.applePay(
          item.appleProductID,
          item.id,
          1,
          (isProductValid: boolean) => {
            if (!isProductValid) {
              this.isPaying = false;
              this.isPaySuccess = false;
              this.isPayFail = true;
            }
          },
        );
      } else {
        const channel = this.payType;
        const currency = this.payType === 'paypal' ? 'USD' : 'CNY';
        createOrder({
          channel,
          currency,
          productID: item.id,
        })
          .then((res: { url: string; orderID: string }) => {
            ipcRenderer.send('add-payment', {
              channel,
              url: window.btoa(res.url),
              orderID: res.orderID,
            });
          })
          .catch((error: ApiError) => {
            this.isPaying = false;
            log.debug('createOrder', error);
            if (error && (error.status === 400 || error.status === 401 || error.status === 403)) {
              // sign in callback
              this.updateCallback(() => {
                this.buy(item);
              });
              remote.app.emit('sign-out');
              ipcRenderer.send('add-login', 'preference');
            } else {
              this.isPayFail = true;
            }
          });
      }
    },
    closePay() {
      this.isPayFail = false;
      this.isPaying = false;
      this.isPaySuccess = false;
      ipcRenderer.send('close-payment');
    },
    goAccount() {
      this.closePay();
      this.$router.push({ name: 'Account' });
    },
    copy() {
      this.isCopyed = true;
      clipboard.writeText('support@splayer.org');
    },
    async getUserInfo() {
      try {
        const res = await getUserInfo();
        this.updateUserInfo(res.me);
      } catch (error) {
        // empty
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
.settingItem {
  &__attached {
    background-color: rgba(0, 0, 0, 0.07);
    margin-top: 15px;
    padding: 20px 28px;
    border-radius: 5px;
  }

  &__title {
    font-family: $font-medium;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }

  &__description {
    font-family: $font-medium;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.25);
    margin-top: 7px;
    margin-bottom: 20px;
  }

  &__functionList {
    display: flex;
    margin-bottom: 25px;
    ul {
      flex: 1;
    }
    li {
      font-family: $font-medium;
      font-size: 11px;
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
    li {
      -webkit-app-region: no-drag;
      width: 110px;
      list-style: none;
      text-align: center;
      background: rgba(0, 0, 0, 0.05);
      padding-top: 18px;
      padding-bottom: 20px;
      cursor: pointer;
      transition: all 200ms ease-in;
      border: 1px solid transparent;
      border-radius: 2px;
      &:hover {
        background: rgba(120, 120, 120, 1);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }
    div {
      font-size: 35px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 300;
      span {
        font-family: $font-normal;
        font-size: 15px;
      }
    }
    p {
      font-family: $font-medium;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 0;
    }
    span {
      font-family: $font-medium;
      font-size: 11px;
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
