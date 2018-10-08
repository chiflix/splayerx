<template>
  <div @mousedown.left="1+1" class="temp-button">
    <Icon class="volume-icon" type="volume" :effect="srcOfVolumeButtonImage"></Icon>
  </div>
</template>;

<script>
import Icon from '../BaseIconContainer';
export default {
  name: 'volume-control',
  components: {
    Icon,
  },
  computed: {
    volume() {
      return 100 * this.$store.state.PlaybackState.Volume;
    },
    srcOfVolumeButtonImage() {
      let srcOfVolumeButtonImage;
      if (this.volume === 0) {
        srcOfVolumeButtonImage = 'mute';
      } else if (this.volume > 0 && this.volume <= 25) {
        srcOfVolumeButtonImage = 'level1';
      } else if (this.volume > 25 && this.volume <= 50) {
        srcOfVolumeButtonImage = 'level2';
      } else if (this.volume > 50 && this.volume <= 75) {
        srcOfVolumeButtonImage = 'level3';
      } else if (this.volume > 75 && this.volume <= 100) {
        srcOfVolumeButtonImage = 'level4';
      }
      return srcOfVolumeButtonImage;
    },
  },
};
</script>
