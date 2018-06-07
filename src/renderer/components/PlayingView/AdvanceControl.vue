<template>
  <div :style="menuStyleObject">
    <div class="advanced"
      v-if="isAcitve">
      <div class="flex-container">
        <div class="items"
          v-for="item in menuList" key="item.title">
          <div>{{ item.title }}</div>
          <div>{{ item.functionality }}</div>
        </div>
      </div>
    </div>
    <div class="button"
      @mousedown.stop="switchSettingMenuState">
      <img src="~@/assets/icon-advanced.svg" type="image/svg+xml">
    </div>
  </div>
</template>;

<script>
export default {
  data() {
    return {
      menuStyleObject: {
        position: 'absolute',
        bottom: '17px',
        right: '27px',
        width: '45px',
        height: '40px',
      },
      menuList: [
        {
          title: 'Speed',
          functionality: '1x',
        },
        {
          title: 'Subtitle',
          functionality: 'On',
        },
        {
          title: 'Audio',
        },
        {
          title: 'Media Info',
        },
      ],
      isAcitve: false,
    };
  },
  methods: {
    onMenuItemClick() {
      console.log('');
    },
    switchSettingMenuState() {
      console.log('switching');
      if (this.isAcitve) {
        this.closeMenuSetting();
      } else {
        this.openMenuSetting();
      }
    },
    closeMenuSetting() {
      this.menuStyleObject.width = `${45}px`;
      this.menuStyleObject.height = `${40}px`;
      this.isAcitve = false;
    },
    openMenuSetting() {
      this.menuStyleObject.width = `${208}px`;
      this.menuStyleObject.height = `${208}px`;
      this.isAcitve = true;
    },
  },
};
</script>

<style lang="scss">
.video-controller {
  .advanced {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background-color: yellow;
    color: black;
    border-radius: 4.8px;
    z-index: 750;
  }

  .flex-container {
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
  }

  .items {
    display: flex;
    justify-content: space-between;
  }

  .button {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 35px;
    height: 30px;
    z-index: 1000;
  }

  .button:hover {
    cursor: pointer;
  }

  .button img {
    width: 35px;
    height: 30px;
  }
}
</style>
