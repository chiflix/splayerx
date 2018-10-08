<template>
  <div :data-component-name="$options.name" class="vr360-container" ref="switchVR360"
    @mousedown="on360Click" >VR
  </div>
</template>;

<script>
export default {
  name: 'vr360-control',
  data() {
    return {
      isVR360On: false,
    };
  },
  methods: {
    on360Click() {
      if (this.isVR360On) {
        this.isVR360On = false;
        // this.$refs.swtichVR360.style.en
        this.$bus.$emit('vr360-off');
      } else {
        this.isVR360On = true;
        // this.$refs.swtichVR360.style.en
        this.$bus.$emit('vr360-on');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// TODO: vr360 button style
.vr360-container{
  clip-path: inset(0px round 10px);
  backdrop-filter: blur(18px);
  justify-content: space-around;
  display: flex;
  background-color: rgba(255, 255, 255, 0.8);
  -webkit-app-region: no-drag;
  align-items: center;
  &:hover {
    cursor: pointer;
  }
}
</style>