interface IMouse {
  on(channel: string, callback: (x: number, y: number) => void): void,
  off(channel: string, callback?: (x: number, y: number) => void): void,
  dispose(): void,
}

class WinMouse implements IMouse {
  private mouse: { on: () => void, off: () => void, destroy: () => void };

  public constructor() {
    try {
      const mouseConstructor = require('win-mouse'); //eslint-disable-line
      this.mouse = mouseConstructor();
    } catch (ex) {
      console.error(ex);
    }
  }

  public on(channel: string, callback: (x: number, y: number) => void) {
    if (this.mouse) this.mouse.on(channel, callback);
  }

  public off(channel: string, callback?: (x: number, y: number) => void) {
    if (this.mouse) this.mouse.off(channel, callback);
  }

  public dispose() {
    if (this.mouse) this.mouse.destroy();
    this.mouse = null;
  }
}

class FakeMouse implements IMouse {
  public on() {} //eslint-disable-line

  public off() {} //eslint-disable-line

  public dispose() {} //eslint-disable-line
}

const Mouse = process.platform === 'win32' ? WinMouse : FakeMouse;

export const mouse: IMouse = new Mouse();
