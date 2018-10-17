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
    <div ref="adv" @mousedown.left="handleDown" @mouseenter="handleEnter" @mouseleave="handleLeave" @mouseover="handleOver">
      <!--<Icon type="advance"></Icon>-->
      <lottie v-on:animCreated="handleAnimation" :options="defaultOptions" lot="advance"></lottie>
    </div>
  </div>
</template>;

<script>
import lottie from '@/components/lottie.vue';
import * as animationData from '@/assets/advance.json';
import AdvanceControlMenuItem from './AdvanceControlMenuItem.vue';
import Icon from '../BaseIconContainer';
export default {
  name: 'advance-control',
  components: {
    AdvanceControlMenuItem,
    Icon,
    lottie,
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
      defaultOptions: { animationData },
      animationSpeed: 1,
      anim: {},
      animFlag: true,
      mouseDown: false,
      validEnter: false,
    };
  },
  methods: {
    handleAnimation(anim) {
      this.anim = anim;
      console.log(anim);
    },
    handleDown() {
      this.mouseDown = true;
      if (!this.showAttached) {
        this.anim.playSegments([17, 21], false);
      } else {
        this.anim.playSegments([37, 41], false);
      }
      this.$refs.adv.onmouseup = () => {
        if (!this.showAttached) {
          if (this.validEnter) {
            this.anim.playSegments([23, 36], false);
          } else {
            this.anim.playSegments([100, 104], false);
          }
        } else if (this.validEnter) {
          this.anim.playSegments([68, 83], false);
        } else {
          console.log(88);
          this.anim.playSegments([43, 47], false);
        }
        this.mouseDown = false;
      };
    },
    handleOver() {
    },
    handleEnter() {
      if (this.animFlag) {
        if (!this.mouseDown) {
          this.anim.playSegments([3, 7], false);
        } else {
          console.log(55);
          this.anim.playSegments([90, 94], false);
        }
      }
      this.validEnter = true;
      this.animFlag = false;
    },
    handleLeave() {
      if (!this.showAttached) {
        if (this.mouseDown) {
          this.anim.playSegments([85, 89], false);
        } else {
          this.anim.playSegments([10, 14], false);
        }
        this.animFlag = true;
      }
      this.validEnter = false;
    },
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
