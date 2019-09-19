<template>
  <form
    @submit.prevent="submit"
    class="box"
    method="post"
  >
    <h1>{{ $t('loginModal.title') }}</h1>
    <div class="mobile-box">
      <input
        v-model="countryCallCodeString"
        type="text"
      >
      <input
        v-model="mobile"
        :placeholder="$t('loginModal.placeholder.mobile')"
        type="text"
      >
    </div>
    <div class="code-box">
      <button
        @click="getCode"
        :disabled="isValidMobile"
      >
        {{ count > 0 ? countString(count) : $t('loginModal.sendCode') }}
      </button>
      <input
        :disabled="isValidMobile"
        v-model="code"
        :placeholder="$t('loginModal.placeholder.code')"
        type="text"
      >
    </div>
    <button
      :disabled="isAllValid || isLogin"
      class="submit"
    >
      {{ $t('loginModal.submit') }}
    </button>
    <p class="error">
      {{ $t('loginModal.error') }}
    </p>
  </form>
</template>
<script lang="ts">
import Vue from 'vue';
// @ts-ignore
import geoip from 'geoip-lite';
import { remote, ipcRenderer } from 'electron';
// @ts-ignore
import metadata from 'libphonenumber-js/metadata.full.json';
import { parsePhoneNumberFromString, getCountryCallingCode } from 'libphonenumber-js';
// import { AxiosResponse, AxiosError } from 'axios';
import { log } from '@/libs/Log';

export default Vue.extend({
  name: 'SMS',
  components: {
  },
  data() {
    return {
      countryCallCodeString: '+86',
      mobile: '',
      code: '',
      count: 0,
      isLogin: false,
    };
  },
  computed: {
    isValidMobile() {
      return !this.validMobile();
    },
    isAllValid() {
      return !(this.validMobile() && this.validCode());
    },
  },
  created() {
    log.debug('sms', metadata);
  },
  mounted() {
    const ip = remote.getGlobal('static_ip');
    const geo = geoip.lookup(ip);
    if (geo && geo.country && getCountryCallingCode(geo.country)) {
      this.countryCallCode = `+${getCountryCallingCode(geo.country)}`;
    }
  },
  methods: {
    validMobile() {
      const countryCallCode = this.countryCallCodeString.replace(/\D/g, '');
      const countryCallCodes = metadata.country_calling_codes[countryCallCode];
      if (!countryCallCodes || countryCallCodes.length === 0) return false;
      let pass = false;
      for (let i = 0; i < countryCallCodes.length; i += 1) {
        const phoneNumber = parsePhoneNumberFromString(this.mobile, countryCallCodes[i]);
        if (phoneNumber && phoneNumber.isValid()) {
          pass = true;
          break;
        }
      }
      log.debug('valid', pass);
      return pass;
    },
    validCode() {
      const code = this.code.trim();
      return /\d{6}/g.test(code);
    },
    getCode() {
      if (this.validMobile(this.mobile) && this.count === 0) {
        this.count = 60;
        this.countDown();
        // this.axios.post('/user', {
        //   firstName: 'Fred',
        //   lastName: 'Flintstone',
        // })
        //   .then((response: AxiosResponse) => {
        //     this.countDown();
        //   })
        //   .catch((error: AxiosError) => {
        //   });
      }
    },
    countString(count: number) {
      return `${count}秒后重发`;
    },
    countDown() {
      const timer = setInterval(() => {
        this.count = this.count - 1;
        if (this.count === 0) {
          clearInterval(timer);
        }
      }, 1000);
    },
    submit() {
      if (this.validMobile() && this.validCode() && !this.isLogin) {
        this.isLogin = true;
        ipcRenderer.send('login-success', {
          token: '123',
          user: {
            id: 'xxx',
          },
        });
        window.close();
      }
    },
  },
});
</script>
<style lang="scss" scoped>
input, button {
  border: none;
  outline: none;
  font-size: 14px;
  color: rgba(255,255,255,0.80);
  letter-spacing: 0;
  line-height: 40px;
}
.box {
  padding: 48px 50px 0 50px;
  h1 {
    font-size: 18px;
    color: rgba(255,255,255,0.68);
    letter-spacing: 0;
    text-align: center;
    line-height: 18px;
    font-weight: 300;
    text-align: left;
    margin-bottom: 16px;
  }
  .error {
    font-size: 14px;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0;
    line-height: 14px;
    text-align: center;
  }
}
.mobile-box {
  height: 40px;
  box-sizing: border-box;
  background: rgba(94,93,102,0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  display: flex;
  margin-bottom: 12px;
  &:focus-within {
    border-color: #ffffff;
  }
  input {
    width: 100%;
    height: 100%;
    padding: 0 16px;
    box-sizing: border-box;
    &::placeholder {
      color: green;
    }
  }
  input:first-child {
    width: 90px;
    border-right: 1px solid rgba(255,255,255,0.30);
  }
}
.code-box {
  height: 40px;
  display: flex;
  margin-bottom: 12px;
  justify-content: space-between;
  flex-direction: row-reverse;
  input {
    width: 178px;
    padding: 0 16px;
    background: rgba(94,93,102,0.25);
    border: 1px solid rgba(255,255,255,0.30);
    border-radius: 2px;
    box-sizing: border-box;
    &:disabled {
      opacity: 0.3;
      cursor: default;
    }
    &::placeholder {
      color: green;
    }
    &:focus {
      border-color: #ffffff;
    }
  }
  button {
    width: 100px;
    background: rgba(94,93,102,0.25);
    border: 1px solid rgba(255,255,255,0.30);
    border-radius: 2px;
    cursor: pointer;
    &:disabled {
      opacity: 0.3;
      cursor: default;
    }
  }
}
.submit {
  width: 100%;
  display: block;
  height: 40px;
  box-sizing: border-box;
  background: rgba(94,93,102,0.25);
  border: 1px solid rgba(255,255,255,0.30);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 16px;
  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
}
</style>
