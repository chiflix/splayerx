<template>
  <form
    @submit.prevent="submit"
    class="box"
    method="post"
  >
    <h1>{{ $t('loginModal.title') }}</h1>
    <div :class="`mobile-box ${countryCallCode.length > 0 ? 'line' : '' }`">
      <input
        @keydown.stop="keydown"
        v-model="countryCallCode"
        @input="countryCallCodeMaxLen"
        type="number"
      >
      <input
        v-model="mobile"
        @keydown.stop="keydown"
        :placeholder="$t('loginModal.placeholder.mobile')"
        @input="mobileMaxLen"
        type="number"
      >
    </div>
    <div class="code-box">
      <button
        :disabled="isValidMobile || count > 0"
        @click="getCode"
      >
        {{ count > 0 ? countString(count) : $t('loginModal.sendCode') }}
      </button>
      <input
        ref="code"
        @keydown.stop="keydown"
        :disabled="isValidMobile"
        v-model="code"
        :placeholder="$t('loginModal.placeholder.code')"
        @input="codeMaxLen"
        type="number"
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
// @ts-ignore
import metadata from 'libphonenumber-js/metadata.mobile.json';
import { remote, ipcRenderer } from 'electron';
import { parsePhoneNumberFromString, getCountryCallingCode } from 'libphonenumber-js/mobile';
// import { AxiosResponse, AxiosError } from 'axios';
import { log } from '@/libs/Log';

export default Vue.extend({
  name: 'SMS',
  components: {
  },
  data() {
    return {
      countryCallCode: '86',
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
    maxLen() {
      let len = 20;
      // const countryCallCodes = metadata.country_calling_codes[this.countryCallCode];
      if (this.countryCallCode === '86') {
        len = 11;
      }
      return len;
    },
  },
  mounted() {
    const ip = remote.getGlobal('static_ip');
    const geo = geoip.lookup(ip);
    if (geo && geo.country && getCountryCallingCode(geo.country)) {
      this.countryCallCode = getCountryCallingCode(geo.country);
    }
  },
  methods: {
    countryCallCodeMaxLen() {
      if (this.countryCallCode.length > 4) {
        this.countryCallCode = this.countryCallCode.slice(0, 4);
      }
    },
    mobileMaxLen() {
      if (this.mobile.length > this.maxLen) {
        this.mobile = this.mobile.slice(0, this.maxLen);
      }
    },
    codeMaxLen() {
      if (this.code.length > 6) {
        this.code = this.code.slice(0, 6);
      }
    },
    validMobile() {
      const countryCallCodes = metadata.country_calling_codes[this.countryCallCode];
      if (!countryCallCodes || countryCallCodes.length === 0) return false;
      let pass = false;
      for (let i = 0; i < countryCallCodes.length; i += 1) {
        const phoneNumber = parsePhoneNumberFromString(this.mobile, countryCallCodes[i]);
        if (phoneNumber) {
          log.debug('sms', phoneNumber);
          log.debug('sms-0', phoneNumber.isValid());
          log.debug('sms-1', phoneNumber.isPossible());
        }
        if (phoneNumber && phoneNumber.isValid()) {
          pass = true;
          break;
        }
      }
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
        if (this.$refs.code) {
          this.$refs.code.focus();
        }
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
    keydown(e: KeyboardEvent) { // eslint-disable-line
      const browserWindow = remote.BrowserWindow;
      const focusWindow = browserWindow.getFocusedWindow();
      const checkCmdOrCtrl = (process.platform === 'darwin' && e.metaKey) || (process.platform !== 'darwin' && e.ctrlKey);
      if (e && e.keyCode === 65 && checkCmdOrCtrl && focusWindow) { // c+a
        focusWindow.webContents.selectAll();
        e.preventDefault();
      } else if (e && e.keyCode === 67 && checkCmdOrCtrl && focusWindow) { // c+c
        focusWindow.webContents.copy();
        e.preventDefault();
      } else if (e && e.keyCode === 86 && checkCmdOrCtrl && focusWindow) { // c+v
        focusWindow.webContents.paste();
        e.preventDefault();
      } else if (e && e.keyCode === 88 && checkCmdOrCtrl && focusWindow) { // c+x
        focusWindow.webContents.cut();
        e.preventDefault();
      } else if (e && e.keyCode === 90 && checkCmdOrCtrl && focusWindow) { // c+z
        focusWindow.webContents.undo();
        e.preventDefault();
      } else if (e && e.keyCode === 90 && checkCmdOrCtrl && e.shiftKey && focusWindow) { // c+s+z
        focusWindow.webContents.redo();
        e.preventDefault();
      }
    },
  },
});
</script>
<style lang="scss" scoped>
input, button {
  border: none;
  outline: none;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: rgba(255,255,255,0.80);
  letter-spacing: 0;
  padding: 0 16px;
  background-color: rgba(94,93,102,0.25);
  transition: background-color 200ms; 
  &:disabled, &.disabled {
    opacity: 0.3;
    cursor: default;
    &:hover {
      background-color: rgba(94,93,102,0.25);
    }
  }
  &:hover {
    background-color: rgba(94,93,102,0.6);
  }
  &:focus {
    border-color: #ffffff;
    background-color: rgba(94,93,102,0.25);
  }
}

input {
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
input[type="number"]{
  -moz-appearance: textfield;
}
button {
  cursor: pointer;
  line-height: 14px;
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
  width: 100%;
  display: flex;
  margin-bottom: 12px;
  position: relative;
  &:hover input{
    background-color: rgba(94,93,102,0.6);
  }
  &.line {
    &::before {
    color: rgba(255,255,255,0.8);
    }
  }
  &::before {
    content: "+";
    position: absolute;
    left: 16px;
    top: 10.5px;
    color: rgba(255,255,255,0.3);
    font-size: 14px;
  }
  &:focus-within input {
    border-color: #ffffff;
    background-color: rgba(94,93,102,0.25);
  }
  input {
    border-radius: 0px 2px 2px 0px;
    width: 100%;
  }
  input:first-child {
    width: 90px;
    border-radius: 2px 0px 0px 2px;
    border-right: none;
    padding-left: 26px;
  }
}
.code-box {
  width: 100%;
  display: flex;
  margin-bottom: 12px;
  justify-content: space-between;
  flex-direction: row-reverse;
  input {
    width: 190px; 
  }
  button {
    width: 110px;
    text-align: center;
  }
}
.submit {
  width: 100%;
  display: block;
  margin-bottom: 14px;
}
</style>
