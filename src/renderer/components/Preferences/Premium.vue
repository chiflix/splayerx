<template>
  <div class="settingItem">
    <div class="settingItem__title">
      {{ $t('preferences.premium.title') }}
    </div>
    <div class="settingItem__description">
      {{ $t('preferences.premium.description') }}
    </div>
    <div
      v-if="isCN"
      class="settingItem__functionList"
    >
      <ul>
        <li>AI翻译功能每天可使用10小时</li>
        <li>更多智能翻译语言选择</li>
      </ul>
      <ul>
        <li>AI翻译功能每天可使用10小时</li>
        <li>更多智能翻译语言选择</li>
      </ul>
    </div>
    <div
      v-else
      class="settingItem__functionList"
    >
      <ul>
        <li>AI翻译功能每天可使用10小时</li>
        <li>更多智能翻译语言选择</li>
      </ul>
    </div>
    <div class="settingItem__payList">
      <BaseRadio
        v-model="payType"
        value="applepay"
      >
        ApplePay
      </BaseRadio>
      <BaseRadio
        v-model="payType"
        value="alipay"
      >
        Alipay
      </BaseRadio>
      <BaseRadio
        v-model="payType"
        value="wxpay"
      >
        Paypal
      </BaseRadio>
    </div>
    <ul class="settingItem__productionList">
      <li
        @click="buy(item)"
        v-for="(item) in list"
        :key="item.id"
      >
        <div>{{ item.currentPrice }}</div>
        <p>{{ country }}</p>
        <span>1 Mon</span>
      </li>
    </ul>
    <div
      v-fade-in="isPaying || isPaySuccess || isPayFail"
      class="modal"
    >
      <div class="mask" />
      <transition name="background">
        <img
          v-if="isPaySuccess"
          class="success-background1"
          src="../../assets/payment-success-background1.svg"
        >
      </transition>
      <transition name="background">
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
        <transition name="success-up">
          <h2 v-if="isPaySuccess">
            感谢您对SPlayer的支持
          </h2>
        </transition>
        <transition name="success-up">
          <h1 v-if="isPaySuccess">
            投食成功!
          </h1>
        </transition>
        <transition name="success-up">
          <h4 v-if="isPaySuccess">
            NOW
          </h4>
        </transition>
        <transition name="success-up2">
          <p v-if="isPaySuccess">
            所有投食记录永久保留
          </p>
        </transition>
        <transition name="success-up2">
          <p v-if="isPaySuccess">
            更多智能翻译语言选择
          </p>
        </transition>
        <transition name="success-up2">
          <p v-if="isPaySuccess">
            无限制导出字幕文件
          </p>
        </transition>
        <transition name="success-fade">
          <span
            v-if="isPaySuccess"
            @click="closePay"
          >立即返回</span>
        </transition>
      </div>
      <div
        v-fade-in="isPaying"
        class="loading-box"
      >
        <div>
          <div class="loader">
            <Icon
              type="loading"
            />
          </div>
        </div>
        <p>投食中，请稍后 ...</p>
        <span @click="closePay">关闭页面</span>
      </div>
      <div
        v-fade-in="isPayFail"
        class="fail-box"
      >
        <h1>很遗憾</h1>
        <p>投食过程中遇到了一些问题，请通过邮箱联系我们</p>
        <h5>
          support@splayer.org <span
            @click="copy"
            :class="isCopyed ? '' : 'canHover'"
          >{{ isCopyed ? '已复制' : '复制' }}</span>
        </h5>
        <span @click="closePay">返回上一页</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { remote, ipcRenderer, clipboard } from 'electron';
import {
  applePay, getProductList, createOrder, ApiError,
} from '@/libs/apis';
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
      isCN: true,
      payType: 'alipay',
      isPaying: false,
      isApplePaing: false,
      isPaySuccess: false,
      isPayFail: false,
      isCopyed: false,
      productList: [
      ],
    };
  },
  computed: {
    ...mapGetters([
      'countryCode',
    ]),
    isMas() {
      return !!process.mas;
    },
    country() {
      if (this.countryCode === 'CN' || !this.countryCode) {
        return 'CNY';
      }
      return 'USD';
    },
    list() {
      return this.productList.map((e: {
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
        },
        id: string,
      }) => {
        const currentPrice = e.currentPrice[this.country] / 100;
        const originalPrice = e.originalPrice[this.country] / 100;
        return {
          id: e.id,
          appleProductID: e.appleProductID,
          currentPrice: currentPrice.toFixed(2),
          originalPrice: originalPrice.toFixed(2),
        };
      });
    },
  },
  async mounted() {
    try {
      this.productList = await getProductList();
    } catch (error) {
      // empty
    }
    ipcRenderer.on('applePay-success', async (e: Event, payment: {
      id: string, productID: string, transactionID: string, receipt: Buffer
    }) => {
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
      } catch (error) {
        this.isPaying = false;
        this.isPaySuccess = false;
        this.isPayFail = true;
      }
      this.isApplePaing = false;
    });
    ipcRenderer.on('applePay-fail', async (e: Event, fail: string) => {
      log.debug('applePay', fail);
      this.isPaying = false;
      this.isPaySuccess = false;
      this.isPayFail = true;
    });
    ipcRenderer.on('close-payment', () => {
      this.closePay();
    });
    ipcRenderer.on('payment-success', () => {
      this.isPaying = false;
      this.isPaySuccess = true;
      this.isPayFail = false;
    });
    ipcRenderer.on('payment-fail', () => {
      this.isPaying = false;
      this.isPaySuccess = false;
      this.isPayFail = true;
    });
  },
  methods: {
    buy(item: {
      id: string,
      appleProductID: string,
      currentPrice: string,
      originalPrice: string
    }) {
      if (this.isPaying) return;
      this.isPaying = true;
      if (this.isMas || this.payType === 'applepay') {
        // @ts-ignore
        remote.app.applePay(item.appleProductID, item.id, 1, (isProductValid: boolean) => {
          if (!isProductValid) {
            this.isPaying = false;
            this.isPaySuccess = false;
            this.isPayFail = true;
          }
        });
      } else {
        const channel = this.payType;
        createOrder({
          channel,
          currency: 'CNY',
          productID: item.id,
        }).then((res: {
          url: string,
          orderID: string,
        }) => {
          log.debug('createOrder', res.url);
          ipcRenderer.send('add-payment', {
            channel,
            url: window.btoa(res.url),
            orderID: res.orderID,
          });
        }).catch((error: ApiError) => {
          this.isPaying = false;
          this.isPayFail = true;
          log.debug('createOrder', error);
          if (error && (error.status === 400 || error.status === 403)) {
            remote.app.emit('sign-out');
            ipcRenderer.send('add-login');
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
    copy() {
      this.isCopyed = true;
      clipboard.writeText('support@splayer.org');
    },
  },
});
</script>
<style lang="scss" scoped>
.settingItem {
  &__attached {
    background-color: rgba(0,0,0,0.07);
    margin-top: 15px;
    padding: 20px 28px;
    border-radius: 5px;
  }

  &__title {
    font-family: $font-medium;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
  }

  &__description {
    font-family: $font-medium;
    font-size: 11px;
    color: rgba(255,255,255,0.25);
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
      color: rgba(255,255,255,0.70);
      letter-spacing: 0;
      list-style-position: inside;
      margin-bottom: 5px;
    }
  }
  &__payList {
    display: flex;
    margin-bottom: 20px;
    &>div {
      padding-right: 20px;
    }
    &>div:last-child {
      padding-right: 0;
    }
  }
  &__productionList {
    font-family: $font-medium;
    display: flex;
    justify-content: space-between;
    li {
      width: 110px;
      list-style: none;
      text-align: center;
      background: rgba(0,0,0,0.05);
      padding-top: 18px;
      padding-bottom: 20px;
      cursor: pointer;
    }
    div {
      font-size: 35px;
      color: #FFFFFF;
      font-weight: lighter;
    }
    p {
      font-size: 10px;
      color: rgba(255,255,255,0.30);
      letter-spacing: 0;
    }
    span {
      font-size: 11px;
      color: rgba(255,255,255,0.70);
      letter-spacing: 0;
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
    background-color: rgba(0,0,0,0.9);
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
  &>div {
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
    color: rgba(255,255,255,0.70);
    svg {
      width: 100%;
      height: 100%;
    }
  }
  p {
    font-size: 13px;
    color: rgba(255,255,255,0.70);
    letter-spacing: -0.3px;
    line-height: 13px;
    margin-bottom: 30px;
  }
  span {
    font-size: 11px;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0;
    line-height: 11px;
    text-decoration: underline;
    cursor: pointer;
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
    color: rgba(255,255,255,0.70);
    letter-spacing: 0;
    text-align: center;
    line-height: 35px;
    margin-bottom: 18px;
  }
  p {
    width: 300px;
    font-size: 13px;
    color: rgba(255,255,255,0.70);
    letter-spacing: 0;
    line-height: 13px;
    margin-bottom: 15px;
  }
  h5 {
    font-size: 15px;
    color: rgba(255,255,255,0.70);
    letter-spacing: 0;
    text-align: center;
    line-height: 15px;
    margin-bottom: 30px;
    span {
      font-size: 11px;
      color: rgba(255,255,255,0.30);
      letter-spacing: 0;
      text-align: center;
      line-height: 11px;
      &.canHover {
        &:hover {
          color: rgba(255,255,255,0.90);
        }
      }
    }
  }
  span {
    font-size: 11px;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0;
    line-height: 11px;
    text-decoration: underline;
    cursor: pointer;
  }
}
.success-box {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
  font-family: $font-medium;
  h2 {
    font-size: 13px;
    color: rgba(255,255,255,0.70);
    letter-spacing: 0;
    text-align: center;
    line-height: 13px;
    margin-bottom: 10px;
  }
  h1 {
    font-size: 35px;
    color: rgba(255,255,255,0.70);
    letter-spacing: 0;
    text-align: center;
    line-height: 35px;
    margin-bottom: 12px;
  }
  h4 {
    font-size: 13px;
    color: rgba(255,255,255,0.20);
    letter-spacing: 0;
    text-align: center;
    line-height: 13px;
    margin-bottom: 15px;
  }
  p {
    font-size: 11px;
    color: rgba(255,255,255,0.70);
    letter-spacing: 0;
    line-height: 11px;
    margin-bottom: 15px;
  }
  span {
    font-size: 11px;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0;
    text-align: center;
    line-height: 11px;
    text-decoration: underline;
    cursor: pointer;
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
  background: rgba(255,255,255,0.78);
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
.background-enter-active {
  animation: bounce-in .3s;
}
.left-icon1-enter-active {
  animation: left-icon1 .4s;
}
.left-icon2-enter-active {
  animation: left-icon2 .4s;
}
.right-icon1-enter-active {
  animation: right-icon1 .4s;
}
.right-icon2-enter-active {
  animation: right-icon2 .4s;
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
    transform: rotate(0)
  }
  100% {
    transform: rotate(360deg)
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
    width: 0;
    height: 0;
  }
  100% {
    width: 100%;
    height: 100%;
  }
}

.success-up-enter-active {
  animation: successUp .4s;
}

.success-up2-enter-active {
  animation: successUp2 .4s;
}

.success-fade-enter-active {
  animation: successFade .4s;
}

@keyframes successUp {
  0% {
    opacity: 0;
    transform: translateY(150%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes successUp2 {
  0% {
    opacity: 0;
    transform: translateY(350%);
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
