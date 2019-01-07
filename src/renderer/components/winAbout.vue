<template>
  <div class="content">
    <img class="winLogo" src="../assets/win-about-logo.png">
    <div class="name">{{ this.$electron.remote.app.getName() }}</div>
    <div class="version">{{ `Version ${this.$electron.remote.app.getVersion()}` }}</div>
    <div class="copyright">Copyright © 2018 tomasen</div>
  </div>
</template>

<script>
export default {
  name: 'winAbout',
};
</script>

<style scoped lang="scss">
  .content {
    width: 100%;
    height: 100%;
    background: url("../assets/windows-about.jpg");
    opacity: 0.95;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    .winLogo {
      width: 96px;
      margin: 67px auto 0 auto;
    }
    .name {
      font-size: 20px;
      margin: -15px auto 0 auto;
      color: rgba(255, 255 ,255 , 1);
    }
    .version {
      font-size: 12px;
      letter-spacing: 0.3px;
      margin: 7px auto 0 auto;
      color: rgba(255, 255 ,255 , 0.8);
    }
    .copyright {
      font-size: 11px;
      letter-spacing: 0.5px;
      color: rgba(255, 255 ,255 , 0.3);
      margin: auto auto 14px auto;
    }
  }
</style>
