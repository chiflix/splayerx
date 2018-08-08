import EventEmitter from 'events';

class baseIpc {
  constructor(event) {
    this.event = event;
  }
  removeListener(message, callback) {
    this.event.removeListener(message, callback);
  }
  removeAllListener() {
    this.event.removeAllListeners();
  }
}
class IpcMain extends baseIpc {
  on(message, callback) {
    return this.event.on(`${message}ipcMain`, callback);
  }
  send(message, args) {
    const eventP = null;
    this.event.emit(`${message}ipcRenderer`, eventP, args);
  }

  once(message, callback) {
    return this.event.once(`${message}ipcMain`, callback);
  }
}
class IpcRenderer extends baseIpc {
  on(message, callback) {
    return this.event.on(`${message}ipcRenderer`, callback);
  }
  send(message, args) {
    const eventP = null;
    this.event.emit(`${message}ipcMain`, eventP, args);
  }
  once(message, callback) {
    return this.event.once(`${message}ipcRenderer`, callback);
  }
}
const event = new EventEmitter();
export const ipcMain = new IpcMain(event);
export const ipcRenderer = new IpcRenderer(event);
