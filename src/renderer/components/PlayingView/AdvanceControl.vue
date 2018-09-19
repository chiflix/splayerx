<template>
  <div
    :data-component-name="$options.name">
    <div :style="menuStyleObject" class="advanced"
      v-if="isAcitve">
      <div class="flex-container">
        <AdvanceControlMenuItem
          v-for="item in menuList"
          :key="item.id"
          :item="item">
        </AdvanceControlMenuItem>
      </div>
    </div>
    <div
      @mousedown="1+1">
      <Icon type="advance"></Icon>
    </div>
  </div>
</template>;

<script>
import AdvanceControlMenuItem from './AdvanceControlMenuItem.vue';
import Icon from '../IconContainer';
export default {
  name: 'advance-control',
  components: {
    AdvanceControlMenuItem,
    Icon,
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
    },
    onMenuItemClick() {
    },
    switchSettingMenuState() {
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
      this.menuStyleObject.height = `${(this.menuList.length * 22) + 120}px`;
    },
  },
  created() {
    this.$bus.$on('change-menu-list', (changedLevel) => {
      this.menuList = changedLevel;
      this.$_fitMenuSize();
    });
  },
};
</script>

<style lang="scss" scoped>
button {
  border: none;
}
button:focus {
  outline: none;
}
button:hover {
  cursor: pointer;
}
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
</style>
