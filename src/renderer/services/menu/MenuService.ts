import { ipcRenderer } from 'electron';

export default class MenuService {
  public on(channel: string, callback: Function) {
    ipcRenderer.on(channel, callback);
  }
}
