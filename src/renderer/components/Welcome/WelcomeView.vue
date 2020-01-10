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
import fs from 'fs';
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    openFileArgs: {
      type: Object,
      default: () => undefined,
    },
  },
  data() {
    return {
      welcomePayload: null,
    };
  },
  computed: {
    openPlayingView() {
      return !!this.openFileArgs;
    },
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
    this.$electron.remote.getCurrentWindow().resizable = false;
    this.welcomePayload = {
      privacyAgreement: true,
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
        } else if (
          this.iconType === 'welcomeNike'
          && this.welcomePayload.primaryLanguage
        ) {
          this.$store.dispatch('welcomeProcess', this.welcomePayload);
          if (this.openPlayingView) {
            const onlyFolders = this.openFileArgs.files
              .every((file: string) => fs.statSync(file).isDirectory());
            if (onlyFolders) {
              this.openFolder(...this.openFileArgs.files);
            } else {
              this.openFile(...this.openFileArgs.files);
            }
          } else {
            this.$router.push({ name: 'landing-view' });
          }
        }
      }
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
