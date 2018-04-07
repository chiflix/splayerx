<template>
  <div class="volume" id="volume">
    <div class="volume--bar volume--mouseover">
      <div class="volume--current">
      </div>
    </div>
    <div class="button" id="volume--button" >
      <img src="~@/assets/icon-volume.svg" type="image/svg+xml" wmode="transparent">
    </div>
  </div>
</template>;

<script>
</script>

<style lang="scss">

.video-controller .volume {
  position: absolute;
  bottom: 25px;
  right: 75px;
  width: 30px;
  height: 150px;
}
.video-controller .volume .volume--bar {
  display: none;
  width: 15px;
  height: 80%;
  margin: 0 auto;
  background-color: white;
  opacity: 0;
}
.video-controller .volume .volume--bar.volume--mouseover {
  opacity: 1;
}

</style>
