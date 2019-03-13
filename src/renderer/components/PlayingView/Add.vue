<template>
  <div class="button" ref="addButton"
    :style="{
      transition: tranFlag ? 'background-color 150ms ease-out, transform 100ms ease-out' : 'background-color 150ms ease-out',
    }"
    @mouseenter="addMouseenter"
    @mouseleave="addMouseleave"
    @mouseup="addMouseup">
    <div class="btnMask">
      <Icon class="addUi" type="add"></Icon>
    </div>
  </div>
</template>
<script>
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    Icon,
  },
  props: {
    index: {
      type: Number,
    },
    addMouseenter: {
      type: Function,
    },
    addMouseleave: {
      type: Function,
    },
    addMouseup: {
      type: Function,
    },
    thumbnailWidth: {
      type: Number,
      default: 112,
    },
    thumbnailHeight: {
      type: Number,
    },
    winWidth: {
      type: Number,
    },
    indexOfMovingTo: {
      type: Number,
    },
    indexOfMovingItem: {
      type: Number,
    },
    movementX: {
      type: Number,
    },
    movementY: {
      type: Number,
    },
  },
  data() {
    return {
      displayIndex: NaN,
      tranFlag: true,
    };
  },
  watch: {
    index(val) {
      this.displayIndex = val;
      this.tranFlag = false;
      this.$refs.addButton.style.setProperty('transform', 'translate(0,0)');
      setTimeout(() => {
        this.tranFlag = true;
      }, 0);
    },
    displayIndex(val) {
      const marginRight = this.winWidth > 1355 ? (this.winWidth / 1355) * 15 : 15;
      const distance = marginRight + this.thumbnailWidth;
      if (val !== this.index) {
        this.$refs.addButton.style.setProperty('transform', `translate(${(val - this.index) * distance}px,0)`);
      } else {
        this.$refs.addButton.style.setProperty('transform', 'translate(0,0)');
      }
    },
    movementX() {
      if (Math.abs(this.movementY) < this.thumbnailHeight) {
        if (this.index > this.indexOfMovingItem && this.index <= this.indexOfMovingTo) {
          this.displayIndex = this.index - 1;
        } else if (this.index >= this.indexOfMovingTo && this.index < this.indexOfMovingItem) {
          this.displayIndex = this.index + 1;
        } else {
          this.displayIndex = this.index;
        }
      }
    },
    movementY(val) {
      if (Math.abs(val) > this.thumbnailHeight) {
        if (this.index >= this.indexOfMovingTo && this.index < this.indexOfMovingItem) {
          this.displayIndex = this.index;
        } else if (this.index > this.indexOfMovingItem) {
          this.displayIndex = this.index - 1;
        }
      } else if (Math.abs(val) < this.thumbnailHeight) {
        if (this.index > this.indexOfMovingItem && this.index <= this.indexOfMovingTo) {
          this.displayIndex = this.index - 1;
        } else if (this.index >= this.indexOfMovingTo && this.index < this.indexOfMovingItem) {
          this.displayIndex = this.index + 1;
        }
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.button {
  border-radius: 2.5px;
  background-color: rgba(0, 0, 0, 0.12);
  transition: background-color 150ms ease-out, transform 100ms ease-out;
  backdrop-filter: blur(9.8px);
  cursor: pointer;
}

.button:hover {
  background-color: rgba(123, 123, 123, 0.12);
  transition: background-color 150ms ease-out;
}

.btnMask {
  border-radius: 2.5px;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
}

.btnMask:hover {
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.addUi {
  margin: auto;
}
</style>
