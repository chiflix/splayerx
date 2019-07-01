interface IMouse {
  on(channel: string, callback: (x: number, y: number) => void): void,
  off(channel: string, callback?: (x: number, y: number) => void): void,
  dispose(): void,
}

class WinMouse implements IMouse {
  private mouse: any;
  constructor() {
    try {
      const mouseConstructor = require('win-mouse');
      this.mouse = mouseConstructor();
    } catch(ex) {
      console.error(ex);
    }
  }

  on(channel: string, callback: (x: number, y: number) => void) {
    if (this.mouse) this.mouse.on(channel, callback);
  }

  off(channel: string, callback?: (x: number, y: number) => void) {
    if (this.mouse) this.mouse.off(channel, callback);
  }

  dispose() {
    if (this.mouse) this.mouse.destroy();
    this.mouse = null;
  }
}

class FakeMouse implements IMouse {
  on() {}
  off() {}
  dispose() {}
}

const Mouse = process.platform === 'win32' ? WinMouse : FakeMouse;

export const mouse: IMouse = new Mouse();
