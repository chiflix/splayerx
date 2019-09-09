const Application = require('spectron').Application;
const path = require('path');

export default {
  afterEach () {
    this.timeout(10000)

    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  },
  beforeEach () {
    this.timeout(10000)

    var electronPath = path.join(__dirname, "../../node_modules", ".bin", "electron");
    if (process.platform === "win32") {
        electronPath += ".cmd";
    }

    this.app = new Application({
      path: electronPath,
      args: ['dist/electron/main.js'],
      startTimeout: 10000,
      waitTimeout: 10000
    })

    return this.app.start()
  }
}
