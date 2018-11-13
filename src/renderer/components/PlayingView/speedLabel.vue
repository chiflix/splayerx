<template>
  <transition name="label">
    <div class="speedLabel" v-show="showLabel">
      <Icon type="speed" class="speedIcon"></Icon>
      <div class="rateNum">{{ rate }}</div>
    </div>
  </transition>
</template>

<script>
import { mapGetters } from 'vuex';
import Icon from '../BaseIconContainer.vue';
export default {
  name: 'speedLabel',
  data() {
    return {
      showLabel: false,
      changeSrc: false,
    };
  },
  components: {
    Icon,
  },
  computed: {
    ...mapGetters(['rate']),
  },
  watch: {
    rate(val) {
      if (val === 1 && !this.changeSrc) {
        setTimeout(() => {
          this.showLabel = false;
        }, 3000);
      } else this.showLabel = !(val === 1 && this.changeSrc);
      this.changeSrc = false;
    },
  },
  mounted() {
    this.$bus.$on('showlabel', () => {
      this.changeSrc = true;
    });
  },
};
</script>

<style lang="scss" scoped>
.speedLabel {
  position: absolute;
  width: auto;
  background-color: rgba(255, 255, 255, 0.22);
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(3px);
  border-radius: 3px;
  display: flex;
  flex-direction: row;
  .rateNum {
    color: rgba(255, 255, 255, 0.36);
    line-height: 9px;
    font-size: 10px;
    margin: 3px 7px auto 2.5px;
    font-family: Avenir;
    font-weight: 600;
  }
}
@media screen and (max-width: 512px) {
  .speedLabel {
    left: 76px;
    bottom: 19px;
    height: 15px;
    .speedIcon {
      margin: auto 0 auto 7.5px;
    }
    .rateNum {
      line-height: 10px;
      font-size: 10px;
      margin: auto 7px auto 2.5px;
    }
  }
}
@media screen and (min-width: 513px) and (max-width: 854px) {
  .speedLabel {
    left: 85px;
    bottom: 24px;
    height: 15px;
    .speedIcon {
      margin: auto 0 auto 7.5px;
    }
    .rateNum {
      line-height: 10px;
      font-size: 10px;
      margin: auto 7px auto 2.5px;
    }
  }
}
@media screen and (min-width: 855px) and (max-width: 1920px) {
  .speedLabel {
    left: 106px;
    bottom: 30px;
    height: 18px;
    .speedIcon {
      margin: auto 0 auto 8px;
    }
    .rateNum {
      line-height: 12px;
      font-size: 12px;
      margin: auto 7.7px auto 3px;
    }
  }
}
@media screen and (min-width: 1921px) {
  .speedLabel {
    left: 160px;
    bottom: 43.5px;
    height: 28px;
    .speedIcon {
      margin: 9px 0 0 12px;
    }
    .rateNum {
      line-height: 16px;
      font-size: 16px;
      margin: 7px 10px 0 4px;
    }
  }
}
.label-enter-active, .label-leave-active {
  transition: opacity .3s;
}
.label-enter, .label-leave-to {
  opacity: 0;
}
</style>
