<template>
<div class="items"
  :style="menuItemStyle"
  @mousedown="onMenuItemClick"
  @mouseover.stop="onMenuItemMouseOver"
  @mouseout.stop="resetAppearence">
  <div
    :style="titleStyle"
    class="title">{{ item.title }}</div>
  <PlusMinusComponent v-if="item.functionality === 'plusMinus'"
    :direction="menuItemStyle.flexDirection"/>
  <SwitchComponent v-else-if="item.functionality === 'switch'"
    :direction="menuItemStyle.flexDirection"/>

  <SliderComponent v-else-if="item.functionality === 'slider'"
    :direction="menuItemStyle.flexDirection"/>

  <PickerComponent v-else-if="item.functionality === 'selector'"
    :direction="menuItemStyle.flexDirection"/>

  <ListComponent v-else-if="item.functionality === 'list'"
    :direction="menuItemStyle.flexDirection"/>

  <InfoComponent v-else-if="item.functionality === 'info'"
    :direction="menuItemStyle.flexDirection"/>

</div>
</template>;

<script>
import PlusMinusComponent from './AdvanceControlFunctionalities/PlusMinusComponent.vue';
import SwitchComponent from './AdvanceControlFunctionalities/SwitchComponent.vue';
import SliderComponent from './AdvanceControlFunctionalities/SliderComponent.vue';
import PickerComponent from './AdvanceControlFunctionalities/PickerComponent.vue';
import ListComponent from './AdvanceControlFunctionalities/ListComponent.vue';
import InfoComponent from './AdvanceControlFunctionalities/InfoComponent.vue';

export default {
  components: {
    PlusMinusComponent,
    SwitchComponent,
    SliderComponent,
    PickerComponent,
    ListComponent,
    InfoComponent,
  },
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
      subtitleLevel: [
        {
          id: 0,
          title: 'Language',
          functionality: 'plusMinus',
        },
        {
          id: 1,
          title: 'Source',
          functionality: 'switch',
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

      this.menuItemStyle.flexDirection = 'row';
    },
    onMenuItemMouseOver() {
      this.$_setItemBackground();
      switch (this.item.title) {
        case 'Speed':
        case 'Subtitle':
          this.titleStyle.height = '30%';
          this.titleStyle.fontSize = '12px';
          this.titleStyle.color = 'rgba(0, 0, 0, 1)';

          this.menuItemStyle.flexDirection = 'column';
          break;
        case 'Audio':
        case 'Media Info':
          this.menuItemStyle.backgroundColor = 'rgba(0, 0, 0, 0.3)';
          break;
        default: break;
      }
    },
    $_setItemBackground() {
      this.menuItemStyle.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    },
    $_resetItemBackground() {
      this.menuItemStyle.backgroundColor = '';
    },
    onSecondItemClick() {
      switch (this.item.title) {
        case 0:

          break;
        default: break;
      }
    },
    onMenuItemClick() {
      switch (this.item.title) {
        case 'Speed':
          break;
        case 'Audio':
          this.$bus.$emit('change-menu-list', this.audioLevel);
          break;
        case 'Media Info':
          this.$bus.$emit('change-menu-list', this.mediaInfoLevel);
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

    .title {
      padding: 0;
      cursor: default;
      transition: font-size 100ms;
    }
  }

}
</style>
