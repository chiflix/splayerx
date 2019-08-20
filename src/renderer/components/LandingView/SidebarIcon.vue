<template>
  <div>
    <svg
      class="side-bar"
      width="13px"
      height="12px"
      viewBox="0 0 13 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g
        id="页面-1"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <g
          id="2"
          transform="translate(-88.000000, -12.000000)"
          fill="#D8D8D8"
          stroke="#979797"
        >
          <path
            id="icon-sidebar"
            :d="d1"
          />
        </g>
      </g>
    </svg>
  </div>
</template>
<script lang="ts">
export default {
  data() {
    return {
      d1: 'M100.5,21.75 L88.5,21.75 L88.5,22.75 L100.5,22.75 L100.5,21.75 Z M100.5,17.5 L88.5,17.5 L88.5,18.5 L100.5,18.5 L100.5,17.5 Z M100.5,13.25 L88.5,13.25 L88.5,14.25 L100.5,14.25 L100.5,13.25 Z',
    };
  },
};
</script>
<style lang="scss" scoped>
.side-bar {
  opacity: 0.4;
  transition: opacity 150ms linear;
  transition-delay: 10ms;
  &:hover {
    opacity: 1;
  }
}
</style>
