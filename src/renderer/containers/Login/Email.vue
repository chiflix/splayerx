<template>
  <form
    @submit.prevent="submit"
    class="box"
    method="post"
  >
    <h1>Sign in with email</h1>
    <div class="email-box">
      <input
        v-model="email"
        @keydown.stop="keydown"
        placeholder="Your email address"
        type="email"
      >
    </div>
    <div class="code-box">
      <input
        :disabled="isValidEmail || isGettingCode || count > 0 || isRobot"
        @click="getCode"
        :value="count > 0 ? countString(count) : isGettingCode ?
          $t('loginModal.sendingCode') : $t('loginModal.sendCode')"
        type="button"
      >
      <input
        ref="code"
        @keydown.stop="keydown"
        :disabled="isValidEmail"
        v-model="code"
        :placeholder="$t('loginModal.placeholder.code')"
        @input="codeMaxLen"
        type="number"
      >
    </div>
    <div id="captcha" />
    <input
      :disabled="isAllValid || isLogin || isRobot"
      :value="isLogin ? $t('loginModal.submitting') : $t('loginModal.submit')"
      type="submit"
      class="submit"
    >
    <a
      class="switch"
      href="#/sms"
      tabindex="-1"
    >
      Sign in with phone
    </a>
    <p
      v-show="message !== ''"
      class="error"
    >
      {{ message }}
    </p>
  </form>
</template>
<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-script-url */
import Vue from 'vue';
import { getEmailCode, signIn, getGeoIP } from '@/libs/webApis';

const ALI_CAPTCHA_APP_KEY = 'FFFF0N0000000000858A';
const ALI_CAPTCHA_SCENE = 'nvc_message';

export default Vue.extend({
  name: 'Email',
  components: {
  },
  data() {
    return {
      email: '',
      code: '',
      count: 0,
      isGettingCode: false,
      isLogin: false,
      message: '',
      isRobot: false,
    };
  },
  computed: {
    isDarwin() {
      // @ts-ignore
      return window.isDarwin; // eslint-disable-line
    },
    isValidEmail() {
      return !this.validateEmail();
    },
    isAllValid() {
      return !(this.validCode());
    },
  },
  created() {
    // @ts-ignore
    window.NVC_Opt = { // eslint-disable-line
      // 无痕配置 && 滑动验证、刮刮卡通用配置
      appkey: ALI_CAPTCHA_APP_KEY,
      scene: ALI_CAPTCHA_SCENE,
      isH5: false,
      popUp: false,
      renderTo: '#captcha',
      trans: {},
      language: 'en',
      // 滑动验证长度配置
      customWidth: 312,
      // 刮刮卡配置项
      width: 321,
      height: 125,
      callback: async (result?: {
        value: string,
        csessionid: string,
        sig: string,
        token: string,
      }) => {
        if (result && result.value === 'pass') {
          this.message = '';
          // 滑动成功
          // @ts-ignore
          const afs = undefined;
          const req = {
            session: result.csessionid,
            sig: result.sig,
            token: result.token,
            scene: ALI_CAPTCHA_SCENE,
            appKey: ALI_CAPTCHA_APP_KEY,
            // @ts-ignore
            remoteIp: window.client_ip, // eslint-disable-line
          };
          this.isGettingCode = true;
          getEmailCode(this.email, afs, req) // eslint-disable-line
            .then((pass) => {
              this.isGettingCode = false;
              if (pass) {
                this.count = 60;
                if (this.$refs.code) {
                  this.$refs.code.focus();
                }
                this.countDown();
                this.message = '';
                this.isRobot = false;
              } else {
                this.message = this.$t('loginModal.afsError');
                this.count = 0;
                this.showNvc();
              }
            }).catch(() => {
              this.message = this.$t('loginModal.netWorkError');
              this.count = 0;
              this.isGettingCode = false;
              this.showNvc();
            });
        }
      },
      elements: [
        'https://img.alicdn.com/tfs/TB17cwllsLJ8KJjy0FnXXcFDpXa-50-74.png',
        'https://img.alicdn.com/tfs/TB17cwllsLJ8KJjy0FnXXcFDpXa-50-74.png',
      ],
      bg_back_prepared: 'https://img.alicdn.com/tps/TB1skE5SFXXXXb3XXXXXXXXXXXX-100-80.png',
      bg_front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABQCAMAAADY1yDdAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAADUExURefk5w+ruswAAAAfSURBVFjD7cExAQAAAMKg9U9tCU+gAAAAAAAAAIC3AR+QAAFPlUGoAAAAAElFTkSuQmCC',
      obj_ok: 'https://img.alicdn.com/tfs/TB1rmyTltfJ8KJjy0FeXXXKEXXa-50-74.png',
      bg_back_pass: '//img.alicdn.com/tfs/TB1KDxCSVXXXXasXFXXXXXXXXXX-100-80.png',
      obj_error: 'https://img.alicdn.com/tfs/TB1q9yTltfJ8KJjy0FeXXXKEXXa-50-74.png',
      bg_back_fail: 'https://img.alicdn.com/tfs/TB1w2oOSFXXXXb4XpXXXXXXXXXX-100-80.png',
    };
    const date = new Date().toISOString().split('T')[0];
    const guideScript = document.createElement('script');
    guideScript.setAttribute('src', `//g.alicdn.com/sd/nvc/1.1.112/guide.js?t=${date}`);
    document.head.appendChild(guideScript);
  },
  async mounted() {
    try {
      const geo = await getGeoIP();
      // @ts-ignore
      window.client_ip = geo.ip;
    } catch (error) {
      // empty
    }
  },
  methods: {
    codeMaxLen() {
      if (this.code.length > 6) {
        this.code = this.code.slice(0, 6);
      }
    },
    validateEmail() {
      const email = this.email.trim();
      return /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/g.test(email);
    },
    validCode() {
      const code = this.code.trim();
      return /\d{4}/g.test(code);
    },
    async getCode() {
      if (this.validateEmail(this.email) && !this.isGettingCode) {
        if (!navigator.onLine) {
          this.message = this.$t('loginModal.noLineError');
          return;
        }
        this.isGettingCode = true;
        try {
          // @ts-ignore
          const afs =  getNVCVal() // eslint-disable-line
          const result = await getEmailCode(this.email, afs);
          if (result) {
            this.count = 60;
            if (this.$refs.code) {
              this.$refs.code.focus();
            }
            this.countDown();
            this.message = '';
            this.isRobot = false;
          } else {
            this.count = 0;
            this.showNvc();
          }
          this.isGettingCode = false;
        } catch (error) {
          this.logSave({ error, email: this.email });
          this.message = this.$t('loginModal.netWorkError');
          this.count = 0;
          this.isGettingCode = false;
        }
      }
    },
    countString(count: number) {
      return this.$t('loginModal.countDown', { count });
    },
    countDown() {
      const timer = setInterval(() => {
        this.count = this.count - 1;
        if (this.count === 0) {
          clearInterval(timer);
        }
      }, 1000);
    },
    async submit() {
      if (this.validCode() && !this.isLogin) {
        if (!navigator.onLine) {
          this.message = this.$t('loginModal.noLineError');
          return;
        }
        this.isLogin = true;
        this.message = '';
        try {
          const result = await signIn('code-email', this.email, this.code);
          if (result) {
            setTimeout(() => {
              window.close();
            }, 200);
          } else {
            this.message = this.$t('loginModal.codeError');
          }
        } catch (error) {
          this.logSave({ error, email: this.email });
          this.message = this.$t('loginModal.netWorkError');
        }
        this.isLogin = false;
      }
    },
    showNvc() {
      this.isRobot = true;
      // @ts-ignore
      window.ipcRenderer.send('login-captcha'); // eslint-disable-line
      setTimeout(() => {
        // 唤醒滑动验证
        // @ts-ignore
        getNC().then(() => { // eslint-disable-line
          const retryText = ` <a href="javascript:__nc.reset()">${this.$t('loginModal.afs.retry')}</a > `;
          // @ts-ignore
          _nvc_nc.upLang('en', { // eslint-disable-line
            _startTEXT: this.$t('loginModal.afs.start'),
            _yesTEXT: this.$t('loginModal.afs.yes'),
            _error300: this.$t('loginModal.afs.error300') + retryText,
            _errorNetwork: this.$t('loginModal.afs.errorNetwork') + retryText,
          });
          // @ts-ignore
          _nvc_nc.reset(); // eslint-disable-line
        });
      }, 100);
    },
    keydown(e: KeyboardEvent) { // eslint-disable-line
      const { isDarwin } = this;
      // @ts-ignore
      const browserWindow = window.remote.BrowserWindow; // eslint-disable-line
      const focusWindow = browserWindow.getFocusedWindow();
      const checkCmdOrCtrl = (isDarwin && e.metaKey) || (isDarwin && e.ctrlKey); // eslint-disable-line
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
  transition: all 200ms;
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
.email-box {
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
  &:focus-within input {
    border-color: #ffffff;
    background-color: rgba(94,93,102,0.25);
  }
  input {
    border-radius: 0px 2px 2px 0px;
    width: 100%;
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
  input[type="button"] {
    width: 110px;
    text-align: center;
  }
}
#captcha {
  -webkit-app-region: no-drag;
  margin-bottom: 12px;
}
.submit {
  width: 100%;
  display: block;
  margin-bottom: 14px;
}
.switch {
  color: rgba(255,255,255,0.3);
  display: block;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
}
.switch:hover {
  color: rgba(255,255,255,0.68);
}
</style>
<style lang="scss">
  .nc_scale {
    height: 40px !important;
    background: rgba(94, 93, 102, .25) !important;
  }
  .nc_scale div.nc_bg {
    background: rgba(94, 93, 102, .6) !important;
  }
  .nc_scale .scale_text {
    width: 310px !important;
    line-height: 38px !important;
    color: rgba(255, 255, 255, 80) !important;
    span[data-nc-lang='_startTEXT'] {
      -webkit-text-fill-color: rgba(255,255,255,0.3) !important;
      color: rgba(255,255,255,0.3) !important;
    }
  }
  .nc_scale .scale_text2 {
    width: 310px !important;
    height: 38px !important;
    border: 1px solid rgba(255,255,255,0.30) !important;
    border-radius: 2px !important;
    span[data-nc-lang='_Loading'], span[data-nc-lang='_yesTEXT'] {
      border: none !important;
    }
  }
  .nc_scale span {
    line-height: 38px !important;
    border: 1px solid #FFFFFF !important;
    border-radius: 2px !important;
    &.nc_lang_cnt {
      width: calc(100% - 2px) !important;
      height: 38px;
    }
  }
  .errloading {
    width: 300px !important;
    height: 20px !important;
    padding: 9px 5px !important;
    border: 1px solid #FFFFFF !important;
    color: rgba(255,255,255,0.8) !important;
    border-radius: 2px !important;
    .icon_warn {
      color: rgba(255,255,255,1) !important;
      margin-right: 5px!important;
    }
    a {
      color: #f5a623 !important;
    }
  }
  .nc_scale .btn_slide {
    height: 38px !important;
    line-height: 38px !important;
    background-color: #A4A4A8 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
  }
  .nc_scale .btn_ok {
    height: 38px !important;
    color: #FFFFFF !important;
    background-color: #A4A4A8 !important;
    border-color: rgba(255,255,255,0.30) !important;
  }
</style>
