<template>
  <div id="wrapper">
    <main>
      Playing  {{ this.$route.params.uri }}
      <div class="video">
        <video id="html-video-object" preload="metadata"></video>
      </div>
      <system-information></system-information>
    </main>
  </div>
</template>

<script>
import SystemInformation from './LandingView/SystemInformation';

export default {
  name: 'playing-view',
  components: {
    SystemInformation,
  },
  methods: {},
};
</script>

<style>

</style>
