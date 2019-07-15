<template>
  <div class="welcome">
    <transition
      name="transform"
      mode="out-in"
    >
      <router-view
        @language-setting="handleSelection"
      />
    </transition>
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        :key="iconType"
        @mousedown="handleIconMousedown"
        @mouseup="handleIconMouseup"
        class="icon no-drag"
      >
        <Icon
          :type="iconType"
          :style="{ cursor: privacyAgreement ? 'pointer' : '' }"
        />
      </div>
    </transition>
  </div>
</template>
<script lang="ts">
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  data() {
    return {
      welcomePayload: null,
    };
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
  created() {
    this.$electron.ipcRenderer.send('callMainWindowMethod', 'setResizable', [false]);
    this.welcomePayload = {
      privacyAgreement: true,
      primaryLanguage: this.$store.getters.primaryLanguage,
      secondaryLanguage: this.$store.getters.secondaryLanguage,
    };
  },
  methods: {
    handleSelection(
      { primaryLanguage, secondaryLanguage }:
      {
        primaryLanguage: string,
        secondaryLanguage: string
      },
    ) {
      this.welcomePayload = {
        ...this.welcomePayload,
        primaryLanguage,
        secondaryLanguage,
      };
    },
    handleIconMousedown() {
      this.mousedown = true;
    },
    handleIconMouseup() {
      if (this.mousedown) {
        if (this.iconType === 'nextStep') {
          this.$router.push({ name: 'language-setting' });
        } else if (this.iconType === 'welcomeNike') {
          this.$store.dispatch('welcomeProcess', this.welcomePayload);
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
    margin-top: 42px;
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
