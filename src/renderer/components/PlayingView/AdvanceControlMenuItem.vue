<template>
<div class="items"
  :style="menuItemStyle"
  @mousedown.stop="onMenuItemClick"
  @mouseover.stop="onMenuItemMouseOver"
  @mouseout.stop="resetAppearence">
  <div
    :style="titleStyle"
    class="title">{{ item.title }}</div>
  <div
    :style="functionStyle"
    class="functionality"
    @mousedown.stop="onSecondItemClick">
    {{ item.functionality }}
  </div>
</div>
</template>;

<script>
export default {
  props: {
    item: Object,
  },
  data() {
    return {
      currentFunctionality: '',
      menuItemStyle: {
        backgroundColor: '',
        fontSize: '16px',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: '4px',
      },
      titleStyle: {
        order: 1,
      },
      functionStyle: {
        order: 2,
      },
      settingLevel: [
        {
          id: 0,
          title: 'Speed',
          functionality: '1x',
        },
        {
          id: 1,
          title: 'Subtitle',
          functionality: 'On',
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
      subtitleLevel: [
        {
          id: 0,
          title: 'Language',
          functionality: '1x',
        },
        {
          id: 1,
          title: 'Source',
          functionality: 'On',
        },
        {
          id: 2,
          title: 'Delay',
        },
        {
          id: 3,
          title: 'Size',
        },
        {
          id: 4,
          title: 'CustomStyle',
        },
        {
          id: 5,
          title: '2nd Subtitle',
        },
      ],
      audioLevel: [
        {
          id: 0,
          title: 'Language',
          functionality: '1x',
        },
        {
          id: 1,
          title: 'Source',
          functionality: 'On',
        },
        {
          id: 2,
          title: 'Delay',
        },
        {
          id: 3,
          title: 'Size',
        },
        {
          id: 4,
          title: 'CustomStyle',
        },
        {
          id: 5,
          title: '2nd Subtitle',
        },
      ],
      mediaInfoLevel: [],
    };
  },
  methods: {
    resetAppearence() {
      this.$_resetItemBackground();
      this.titleStyle.fontSize = '16px';
      this.titleStyle.color = 'rgba(0,0,0,1)';
      this.titleStyle.height = '100%';

      this.functionStyle.textAlign = 'right';
      this.functionStyle.height = '100%';

      this.menuItemStyle.flexDirection = 'row';

      this.item.functionality = this.currentFunctionality;
    },
    onMenuItemMouseOver() {
      this.$_setItemBackground();
      switch (this.item.title) {
        case 'Speed':
        case 'Subtitle':
          this.titleStyle.height = '30%';
          this.titleStyle.fontSize = '12px';
          this.titleStyle.color = 'rgba(0, 0, 0, 1)';

          this.functionStyle.height = '70%';
          this.functionStyle.textAlign = 'center';

          this.menuItemStyle.flexDirection = 'column';

          this.currentFunctionality = this.item.functionality;
          this.item.functionality = this.$_setContent();
          break;
        case 'Audio':
        case 'Media Info':
          this.menuItemStyle.backgroundColor = 'rgba(0, 0, 0, 0.3)';
          this.item.functionality = this.$_setContent();
          break;
        default: break;
      }
    },
    $_setContent() {
      switch (this.item.title) {
        case 'Speed':
          return '+ 1x -';
        case 'Subtitle':
          return 'On Off';
        case 'Audio':
        case 'Media Info':
          return '>';
        default: return '';
      }
    },
    $_setItemBackground() {
      this.menuItemStyle.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    },
    $_resetItemBackground() {
      this.menuItemStyle.backgroundColor = '';
    },
    onSecondItemClick() {
      console.log('itemclick');
      switch (this.item.title) {
        case 0:

          break;
        default: break;
      }
    },
    onMenuItemClick() {
      console.log('menuclick');
      switch (this.item.title) {
        case 'Speed':
          break;
        case 'Audio':
          this.$bus.$emit('changeMenuList', this.audioLevel);
          break;
        case 'Media Info':
          this.$bus.$emit('changeMenuList', this.mediaInfoLevel);
          break;
        default: break;
      }
    },
  },
};
</script>

<style lang="scss">
.video-controller {
  .items {
    display: flex;
    height: 35px;

    .functionality {
      padding: 0;
      cursor: pointer;
    }

    .title {
      padding: 0;
      cursor: default;
      transition: font-size 100ms;
    }
  }

}
</style>
