interface IMouse {
  on(channel: string, callback: (x: number, y: number) => void): void,
  off(channel: string, callback?: (x: number, y: number) => void): void,
  dispose(): void,
}

class Mouse implements IMouse {
  private mouse: {
    on(channel: string, callback: (x: number, y: number) => void): void,
    off(channel: string, callback?: (x: number, y: number) => void): void,
    destroy(): void,
  } | null;

  public constructor() {
    try {
      const mouseConstructor = process.platform === 'win32' ? require('win-mouse') : require('osx-mouse-cocoa'); //eslint-disable-line
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

export const mouse: IMouse = new Mouse();
