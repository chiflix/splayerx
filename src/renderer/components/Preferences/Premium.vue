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
        value="Alipay"
      >
        Alipay
      </BaseRadio>
      <BaseRadio
        v-model="payType"
        value="Paypal"
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
        <p>USD</p>
        <span>1 Mon</span>
      </li>
    </ul>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { remote, ipcRenderer } from 'electron';
import { applePay, getProductList } from '@/libs/apis';
import BaseRadio from './BaseRadio.vue';
import { log } from '../../libs/Log';

export default Vue.extend({
  name: 'Premium',
  components: {
    BaseRadio,
  },
  data() {
    return {
      isCN: true,
      payType: 'Alipay',
      isPaying: false,
      list: [
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
  },
  async mounted() {
    try {
      const list = await getProductList(this.country);
      list.forEach((e: {
        id: string,
        appleProductID: string,
        currentPrice: string,
        originalPrice: string
      }) => {
        this.list.push(e);
      });
    } catch (error) {
      // empty
    }
    ipcRenderer.on('applePay-success', async (e: Event, payment: {
      id: string, productID: string, transactionID: string, receipt: string
    }) => {
      try {
        await applePay({
          productID: payment.id,
          transactionID: payment.transactionID,
          receipt: payment.receipt,
        });
      } catch (error) {
        this.isPaying = false;
      }
    });
    ipcRenderer.on('applePay-fail', async (e: Event, fail: string) => {
      log.debug('applePay', fail);
      this.isPaying = false;
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
      // @ts-ignore
      remote.app.applePay(item.appleProductID, item.id, 1, (isProductValid: boolean) => {
        if (!isProductValid) {
          this.isPaying = false;
        }
      });
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
    &>div:nth-child(1) {
      padding-right: 20px;
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
</style>
