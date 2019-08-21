<template>
  <svg
    width="42px"
    height="42px"
    viewBox="0 0 42 42"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
  >
    <defs>
      <circle
        id="path-1"
        cx="20"
        cy="20"
        r="20"
      />
    </defs>
    <g
      id="页面-1"
      stroke="none"
      stroke-width="1"
      fill="none"
      fill-rule="evenodd"
    >
      <g
        id="2"
        transform="translate(-17.000000, -157.000000)"
      >
        <g
          id="sideBarItems"
          transform="translate(18.000000, 46.000000)"
        >
          <g
            id="sideBarItem--youtube"
            class="sidebar"
            transform="translate(0.000000, 112.000000)"
          >
            <mask
              id="mask-2"
              fill="white"
            >
              <use xlink:href="#path-1" />
            </mask>
            <circle
              stroke="#EBECF0"
              fill="#FF0000"
              stroke-width="1"
              cx="20"
              cy="20"
              r="20.5"
            />
            <g
              id="logo--youtube"
              stroke-width="1"
              fill-rule="evenodd"
              mask="url(#mask-2)"
            >
              <g
                id="路径"
                transform="translate(-2.376364, 4.000000)"
                fill-rule="nonzero"
              >
                <polygon
                  fill="#FFFFFF"
                  points="18.2909091 22.8581818 30.1672727 16 18.2909091 9.14181818"
                />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>
<script lang="ts">
export default {

};
</script>
<style lang="scss" scoped>
.sidebar {
  transition: opacity 50ms ease-in;
  opacity: 0.5;
  &:hover {
    cursor: pointer;
    opacity: 1;
  }
}
</style>
