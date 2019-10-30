<template>
  <div
    v-fade-in="showForbiddenModal"
    class="audio-translate"
  >
    <div
      class="modal-mask"
    />
    <div
      class="forbidden-modal"
    >
      <div
        @click="hideModal"
        class="close-box"
      >
        <Icon
          class="icon"
          type="closeSquare"
        />
      </div>
      <h1>
        {{ $t("exportForbiddenModal.title") }}
      </h1>
      <p>
        {{ $t("exportForbiddenModal.content") }}
        <br><span
          @click.left="signIn"
          v-if="!token"
        >{{ $t("exportForbiddenModal.span") }}</span>
      </p>
      <div
        @click.left="goPremium"
        class="button"
      >
        {{ $t("exportForbiddenModal.button") }}
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { ipcRenderer, remote } from 'electron';
import { mapGetters, mapActions } from 'vuex';
import {
  UserInfo as usActions,
} from '@/store/actionTypes';
import Icon from '@/components/BaseIconContainer.vue';

export default Vue.extend({
  name: 'ForbiddenModal',
  components: {
    Icon,
  },
  data() {
    return {

    };
  },
  computed: {
    ...mapGetters([
      'showForbiddenModal', 'token',
    ]),
  },
  methods: {
    ...mapActions({
      hideModal: usActions.HIDE_FORBIDDEN_MODAL,
    }),
    signIn() {
      // 清楚登录信息， 开登录窗口
      remote.app.emit('sign-out');
      ipcRenderer.send('add-login', 'main');
    },
    goPremium() {
      ipcRenderer.send('add-preference', 'premium');
    },
  },
});
</script>
<style lang="scss" scoped>
.modal-mask {
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  opacity: 0.7;
  background: #000000;
}
.forbidden-modal {
  position: fixed;
  width: 330px;
  padding: 24px 30px;
  box-sizing: border-box;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  border: 1px solid rgba(160,160,160,0.7);
  background-image: radial-gradient(
    80% 130%,
    rgba(85,85,85,0.88) 20%,
    rgba(85,85,85,0.78) 50%,
    rgba(85,85,85,0.72) 60%,
    rgba(85,85,85,0.46) 80%,
    rgba(85,85,85,0.00) 100%
  );
  border-radius: 7px;
  box-shadow: 0 0 1px 0 rgba(0,0,0,0.10);
  zoom: 1;
  .close-box {
    position: absolute;
    top: 15px;
    right: 15px;
    -webkit-app-region: no-drag;
    .icon {
      width: 11px;
      height: 11px;
      cursor: pointer;
    }
  }

  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    & {
      display: none;
    }
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    zoom: 1;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    zoom: 1.3;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    zoom: 1.68;
  }

  h1 {
    font-size: 13px;
    color: rgba(255,255,255,0.90);
    letter-spacing: 1px;
    line-height: 13px;
    margin-bottom: 10px;
  }
  p {
    font-size: 11px;
    color: rgba(255,255,255,0.50);
    line-height: 16px;
    margin-bottom: 10px;
    span {
      text-decoration: underline;
      cursor: pointer;
    }
  }
  .button {
    cursor: pointer;
    font-size: 11px;
    color: #FFFFFF;
    text-align: center;
    border-radius: 2px;
    line-height: 28px;
    border: 1px solid rgba(255,255,255,0.1);
    background-color: rgba(255,255,255,0.03);
    transition: all 200ms;

    &:not(.disabled):hover {
      border: 1px solid rgba(255,255,255,0.2);
      background-color: rgba(255,255,255,0.08);
    }
    &.disabled {
      // opacity: 0.3;
      cursor: default;
      color: rgba(255,255,255,0.3);
      border: 1px solid rgba(255,255,255,0.03);
      background-color: rgba(255,255,255,0.009);
    }
  }
}
</style>
