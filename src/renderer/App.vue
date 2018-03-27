<template>
  <div id="app" class="application">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'splayer',
  };
</script>

<style>
  /* CSS */

  @import url('https://fonts.googleapis.com/css?family=Open+Sans');

  * {
  	margin: 0;
  	padding: 0;
  	background: transparent;
  }

  html {
  	width: 100%;
  	height: 100%;
  }

  body {
    font-family: 'Open Sans', sans-serif;
  	position: relative;
  	width: 100%;
  	height: 100%;
  }

  .application {
  	position: relative;
  	width: 100%;
  	height: 100%;
  	border-radius: 4px;
  	overflow: hidden;
  	-webkit-app-region: drag;
  }
</style>
