<template>
  <div class="speedLabel">
    <Icon type="speed" class="speedIcon"></Icon>
    <div class="rateNum">{{ rate }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Icon from '../BaseIconContainer.vue';
export default {
  name: 'speedLabel',
  components: {
    Icon,
  },
  computed: {
    ...mapGetters(['rate']),
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
    display: none;
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
    bottom: 43.6px;
    height: 25px;
    .speedIcon {
      margin: auto 0 auto 12px;
    }
    .rateNum {
      line-height: 17px;
      font-size: 17px;
      margin: auto 10px auto 4px;
    }
  }
}
</style>
