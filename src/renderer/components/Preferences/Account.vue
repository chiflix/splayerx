<template>
  <div class="settingItem">
    <div class="settingItem__title">
      {{ $t('preferences.account.title') }}
    </div>
    <div class="settingItem__attached">
      <div v-if="!token">
        <div class="settingItem__title">
          {{ $t('preferences.account.noToken.title') }}
        </div>
        <div class="settingItem__description">
          {{ $t('preferences.account.noToken.description') }}
        </div>
        <button
          @click="signIn"
          class="settingItem__button"
        >
          {{ $t('preferences.account.noToken.button') }}
        </button>
      </div>
      <div v-else>
        <div class="settingItem__box">
          <div class="settingItem__box__left">
            <div class="settingItem__title">
              {{ isVip ? 'Premium Account' : 'Account' }} {{ '****2468' }} <span>注销</span>
            </div>
            <div class="settingItem__description">
              Upgrade your account now and get started with exclusive features and more.
            </div>
          </div>
          <div class="settingItem__box__right">
            <button v-if="isVip">
              Renew
            </button>
            <button v-else>
              成为VIP
            </button>
          </div>
        </div>
        <div class="settingItem__title">
          Registration Date
        </div>
        <div class="settingItem__description">
          2018-05-23
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { remote, ipcRenderer } from 'electron';
import { mapGetters } from 'vuex';

export default Vue.extend({
  name: 'Account',
  components: {
  },
  data() {
    return {
      isVip: false,
    };
  },
  computed: {
    ...mapGetters([
      'userInfo', 'token',
    ]),
  },
  methods: {
    signIn() {
      remote.app.emit('sign-out');
      ipcRenderer.send('add-login');
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
    margin-bottom: 7px;
  }

  button {
    width: 100%;
    font-family: $font-medium;
    font-size: 11px;
    color: #FFFFFF;
    letter-spacing: 0;
    text-align: center;
    line-height: 28px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  &__button {
    margin-top: 6px;
  }
  &__box {
    display: flex;
    margin-bottom: 10px;
    span {
      font-size: 11px;
    }
    &__left {
      flex: 1;
      padding-right: 10px;
    }
    &__right {
      display: flex;
      align-items: center;
      button {
        padding-left: 8px;
        padding-right: 8px;
      }
    }
  }
}
</style>
