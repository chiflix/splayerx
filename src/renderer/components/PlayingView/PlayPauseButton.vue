<template>
  <!-- <transition name="fade">
    <img type="image/svg+xml" :src="src" v-if="icon_show">
  </transition> -->

    <transition name="fade">
    <img type="image/svg+xml"  :src="src"
      v-if="icon_show">
    </transition>

</template>

<script>
export default {
  data() {
    return {
      icon_show: false,
      lol: '',
      src: '',
    };
    // src: require('../../assets/icon-pause.svg'),
  },
  // methods: {
  //   animationEnd() {
  //     this.lol = 'style= display: none';
  //   },
  // },
  created() {
    console.log('PlayPauseButton Created');
  },
  mounted() {
    this.$bus.$on('twinkle-pause-icon', () => {
      console.log('Its BEEN TRigerred. Paused.');
      this.src = require('../../assets/icon-pause.svg');
      this.icon_show = true;
    });
    this.$bus.$on('twinkle-play-icon', () => {
      console.log('Its BEEN TRigerred. Played.');
      this.src = require('../../assets/icon-play.svg');
      this.icon_show = true;
    });
  },
};
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 3s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
