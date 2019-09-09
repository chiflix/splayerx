<template>
  <div
    @mouseup="handleSidebar"
  >
    <svg
      :opacity="mouseover ? '1' : '0.5'"
      class="side-bar"
      width="13px"
      height="12px"
      viewBox="0 0 13 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g
        id="LandingView"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <g
          id="2"
          transform="translate(-89.000000, -12.000000)"
        >
          <path
            id="icon-sidebar"
            :d="d1"
            :fill="fill ? fill : highlight ? '#FFF' : '#ACACAC'"
          />
        </g>
      </g>
    </svg>
  </div>
</template>
<script lang="ts">
export default {
  props: {
    fill: {
      type: String,
      default: '',
    },
    mouseover: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      d1: 'M101.5,21.25 C101.776142,21.25 102,21.4738576 102,21.75 L102,22.75 C102,23.0261424 101.776142,23.25 101.5,23.25 L89.5,23.25 C89.2238576,23.25 89,23.0261424 89,22.75 L89,21.75 C89,21.4738576 89.2238576,21.25 89.5,21.25 L101.5,21.25 Z M101.5,17 C101.776142,17 102,17.2238576 102,17.5 L102,18.5 C102,18.7761424 101.776142,19 101.5,19 L89.5,19 C89.2238576,19 89,18.7761424 89,18.5 L89,17.5 C89,17.2238576 89.2238576,17 89.5,17 L101.5,17 Z M101.5,12.75 C101.776142,12.75 102,12.9738576 102,13.25 L102,14.25 C102,14.5261424 101.776142,14.75 101.5,14.75 L89.5,14.75 C89.2238576,14.75 89,14.5261424 89,14.25 L89,13.25 C89,12.9738576 89.2238576,12.75 89.5,12.75 L101.5,12.75 Z',
      highlight: false,
    };
  },
  created() {
    this.$bus.$on('highlight-sidebar', (highlight: boolean) => {
      this.highlight = highlight;
    });
  },
  methods: {
    handleSidebar() {
      this.$event.emit('side-bar-mouseup');
    },
  },
};
</script>
<style lang="scss" scoped>
.side-bar {
  transition: opacity 150ms linear;
  transition-delay: 10ms;
}
path {
  transition: fill 300ms linear;
  transition-delay: 50ms;
}
</style>
