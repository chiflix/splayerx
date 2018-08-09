<template>
  <div
    @click="open('./')">
    <img class="button" src="~@/assets/icon-open.svg" type="image/svg+xml" style="-webkit-user-drag: none;">
  </div>
</template>

<script>
export default {
  name: 'Openbutton',
  data() {
    return {
      showingPopupDialog: false,
    };
  },
  props: {
    isDragging: {
      type: Boolean,
    },
  },
  methods: {
    open(link) {
      if (this.showingPopupDialog || this.isDragging) {
        // skip if there is already a popup dialog
        return;
      }
      const self = this;
      const { remote } = this.$electron;
      const { dialog } = remote;
      const browserWindow = remote.BrowserWindow;
      const focusedWindow = browserWindow.getFocusedWindow();
      const VALID_EXTENSION = [];

      self.showingPopupDialog = true;
      dialog.showOpenDialog(focusedWindow, {
        title: 'Open Dialog',
        defaultPath: link,
        filters: [{
          name: 'Video Files',
          extensions: VALID_EXTENSION,
        }],
        properties: ['openFile'],
      }, (item) => {
        self.showingPopupDialog = false;
        if (item) {
          self.openFile(`file:///${item[0]}`);
        }
      });
    },
  },
};
</script>

<style lang="scss">
  .button {
    position: absolute;
    bottom: 50px;
    right: 45px;
    width: 49px;
    height: 42px;
    font-size: .8em;
    cursor: pointer;
    outline: none;
    transition: all 0.15s ease;
    border: 0px;
    z-index: 5;
  }
</style>
