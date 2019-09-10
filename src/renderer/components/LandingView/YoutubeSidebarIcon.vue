<template>
  <div
    @mouseover="mouseover = true"
    @mouseout="mouseover = false"
    @click="mouseupOnIcon(url)"
    :style="{
      opacity: mouseover || selected ? '1.0' : '0.7',
    }"
  >
    <svg
      width="44px"
      height="44px"
      viewBox="0 0 44 44"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <circle
          id="path-1"
          cx="22"
          cy="22"
          r="22"
        />
      </defs>
      <g
        id="组件"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <g
          id="sideBarItem/__logoWithColorBg/--youtube"
          transform="translate(0.000000, 0.000000)"
        >
          <mask
            id="mask-2"
            fill="white"
          >
            <use xlink:href="#path-1" />
          </mask>
          <use
            id="colorBg"
            fill="#FF0000"
            xlink:href="#path-1"
          />
          <polygon
            id="路径"
            fill="#FFFFFF"
            fill-rule="nonzero"
            mask="url(#mask-2)"
            points="17.1970909 29.544 30.2610909 22 17.1970909 14.456"
          />
        </g>
      </g>
    </svg>
  </div>
</template>
<script lang="ts">
import { log } from '@/libs/Log';

export default {
  props: {
    selected: {
      type: Boolean,
      default: false,
    },
    url: {
      type: String,
      default: '',
    },
    mouseupOnIcon: {
      type: Function,
      default: () => {
        log.debug('YoutubeSidebarIcon.vue', 'mouse up on button');
      },
    },
  },
  data() {
    return {
      mouseover: false,
    };
  },
};
</script>
<style lang="scss" scoped>
.sidebar {
  transition: opacity 100ms ease-in;
}
</style>
