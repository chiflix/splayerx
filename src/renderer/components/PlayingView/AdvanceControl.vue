<template>
  <div :style="menuStyleObject">
    <div class="advanced"
      v-if="isAcitve">
      <div class="flex-container">
        <AdvanceControlMenuItem
          v-for="item in menuList"
          :key="item.id"
          :item="item">
        </AdvanceControlMenuItem>
      </div>
    </div>
    <div class="button"
      @mousedown.stop="switchSettingMenuState">
      <img src="~@/assets/icon-advanced.svg" type="image/svg+xml">
    </div>
  </div>
</template>;

<script>
import AdvanceControlMenuItem from './AdvanceControlMenuItem.vue';

export default {
  components: {
    AdvanceControlMenuItem,
  },
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
          id: 0,
          title: 'Speed',
          functionality: 'plusMinus',
        },
        {
          id: 1,
          title: 'Subtitle',
          functionality: 'switch',
        },
        {
          id: 2,
          title: 'Audio',
        },
        {
          id: 3,
          title: 'Media Info',
        },
      ],
      settingLevel: [
        {
          id: 0,
          title: 'Speed',
          functionality: 'plusMinus',
        },
        {
          id: 1,
          title: 'Subtitle',
          functionality: 'switch',
        },
        {
          id: 2,
          title: 'Audio',
        },
        {
          id: 3,
          title: 'Media Info',
        },
      ],
      isAcitve: false,
    };
  },
  methods: {
    onSecondItemClick() {
      console.log('itemclick');
    },
    onMenuItemClick() {
      console.log('menuclick');
      console.log(this.$refs.menuList[0].key);
    },
    switchSettingMenuState() {
      console.log('switching');
      if (this.isAcitve) {
        this.menuList = this.settingLevel;
        this.closeMenuSetting();
      } else {
        this.openMenuSetting();
      }
    },
    closeMenuSetting() {
      this.menuStyleObject.width = `${45}px`;
      this.menuStyleObject.height = `${40}px`;
      this.menuList = this.settingLevel;
      this.isAcitve = false;
    },
    openMenuSetting() {
      this.menuStyleObject.width = `${208}px`;
      this.$_fitMenuSize();
      this.isAcitve = true;
    },
    $_fitMenuSize() {
      console.log(this.menuList.length);
      this.menuStyleObject.height = `${(this.menuList.length * 22) + 120}px`;
    },
  },
  created() {
    this.$bus.$on('changeMenuList', (changedLevel) => {
      this.menuList = changedLevel;
      this.$_fitMenuSize();
    });
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
    background-color: white;
    opacity: 0.3;
    backdrop-filter: blur(20px);
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
