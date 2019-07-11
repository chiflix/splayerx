<template>
  <div class="welcome">
    <transition :name="transitionMode" mode="out-in">
      <router-view />
    </transition>
    <transition name="fade" mode="out-in">
      <div
        :key="iconType"
        @mousedown="handleIconMousedown"
        @mouseup="handleIconMouseup"
        class="icon no-drag"
      >
          <Icon
            :type="`${iconType}${privacyAgreement ? '' : 'Disable'}`"
            :style="{ cursor: privacyAgreement ? 'pointer' : '' }"
          />
      </div>
    </transition>
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';
import { codeToLanguageName } from '@/libs/language';

export default {
  components: {
    Icon,
  },
  data() {
    return {
      transitionMode: 'transform',
    };
  },
  created() {
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setResizable', [false]);
  },
  watch: {
    $route({ name: to }: { name: string }, { name: from }: { name: string }) {
      if (to === 'language-setting') this.transitionMode = 'transform';
      else this.transitionMode = '';
    },
  },
  computed: {
    privacyAgreement() {
      return this.$store.getters.privacyAgreement;
    },
    iconType() {
      const currentRouteName = this.$route.name;
      if (currentRouteName === 'welcome-privacy') {
        return 'nextStep';
      }
      return 'welcomeNike';
    },
  },
  methods: {
    handleIconMousedown() {
      this.mousedown = true;
    },
    handleIconMouseup() {
      if (this.mousedown) {
        if (this.iconType === 'nextStep' && this.privacyAgreement) {
          this.$router.push({ name: 'language-setting' });
        } else if (this.iconType === 'welcomeNike') {
          this.$router.push({ name: 'landing-view' });
        }
      }
    },
    handleLinkClick() {
      console.log(this.$i18n.locale);
      // if (this.$i18n.locale === 'zh')
    },
  },
};
</script>
<style lang="scss" scoped>
.welcome {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  height: 100%;

  .icon {
    width: 40px;
    height: 40px;
    padding-top: 42px;
  }
}
.transform {
  &-enter-active {
    transition-property: transform, opacity;
    transition-duration: 300ms;
    transition-timing-function: ease-out;
  }
  &-leave-active {
    transition-property: transform, opacity;
    transition-duration: 250ms;
    transition-timing-function: ease-in;
  }
  &-enter {
    transform: translateX(100px);
    opacity: 0;
  }
  &-leave-to {
    transform: translateX(-100px);
    opacity: 0;
  }
}

.fade {
  &-enter-active {
    transition: opacity 300ms ease-in;
  }
  &-leave-active {
    transition: opacity 250ms ease-in;
  }
  &-enter {
    opacity: 0;
  }
  &-leave-to {
    opacity: 0;
  }
}
</style>
