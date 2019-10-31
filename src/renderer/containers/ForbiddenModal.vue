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
        {{ title }}
      </h1>
      <p>
        <span v-html="content" />
        <br><span
          @click.left="signIn"
          v-if="!token"
          class="link"
        >{{ signText }}</span>
      </p>
      <div
        @click.left="goPremium"
        class="button"
      >
        {{ buttonText }}
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { remove, findIndex } from 'lodash';
import { ipcRenderer, remote } from 'electron';
import { mapGetters, mapActions } from 'vuex';
import {
  UserInfo as usActions,
} from '@/store/actionTypes';
import { getJsonConfig } from '@/helpers/featureSwitch';
import Icon from '@/components/BaseIconContainer.vue';

export default Vue.extend({
  name: 'ForbiddenModal',
  components: {
    Icon,
  },
  data() {
    return {
      audioLanguageString: '',
    };
  },
  computed: {
    ...mapGetters([
      'showForbiddenModal', 'token', 'which',
    ]),
    title() {
      if (this.which === 'translate') {
        return this.$t('forbiddenModal.translate.title');
      } if (this.which === 'export') {
        return this.$t('forbiddenModal.export.title');
      }
      return this.$t('forbiddenModal.title');
    },
    content() {
      if (this.which === 'translate') {
        return `${this.$t('forbiddenModal.translate.content')}<br/><br/>${this.audioLanguageString}`;
      } if (this.which === 'export') {
        return this.$t('forbiddenModal.export.content');
      }
      return this.$t('forbiddenModal.content');
    },
    signText() {
      if (this.which === 'translate') {
        return this.$t('forbiddenModal.translate.span');
      } if (this.which === 'export') {
        return this.$t('forbiddenModal.export.span');
      }
      return this.$t('forbiddenModal.span');
    },
    buttonText() {
      if (this.which === 'translate') {
        return this.$t('forbiddenModal.translate.button');
      } if (this.which === 'export') {
        return this.$t('forbiddenModal.export.button');
      }
      return this.$t('forbiddenModal.button');
    },
  },
  async mounted() {
    this.audioLanguageString = this.$t('forbiddenModal.audioLanguage');
    try {
      const configString = await this.getMoreLanguages();
      if (configString) {
        this.audioLanguageString = configString;
      }
    } catch (error) {
      // empty
    }
  },
  methods: {
    ...mapActions({
      hideModal: usActions.HIDE_FORBIDDEN_MODAL,
    }),
    signIn() {
      // 清楚登录信息， 开登录窗口
      remote.app.emit('sign-out');
      ipcRenderer.send('add-login', 'main');
      this.hideModal();
    },
    goPremium() {
      ipcRenderer.send('add-preference', 'premium');
      this.hideModal();
    },
    async getMoreLanguages() {
      const vipAudioLanguage = await getJsonConfig('vipAudioLanguage', null);
      const normalAudioLanguage = await getJsonConfig('audioLanguage', null);
      if (vipAudioLanguage && vipAudioLanguage['list']) {
        const list = vipAudioLanguage['list'];
        const normal = normalAudioLanguage && normalAudioLanguage['list'] ? normalAudioLanguage['list'] : [];
        remove(list, (e: {
          value: string,
          label: string,
        }) => {
          if (!normal || !normal.length) {
            return false;
          }
          const index = findIndex(normal, (item: {
            value: string,
            label: string,
          }) => item.value === e.value);
          return index > -1;
        });
        return list.map((e: {
          value: string,
          label: string,
        }) => e.label).join(', ');
      }
      return '';
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
    word-break: break-word;
    .link {
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
