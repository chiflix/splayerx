import EventEmitter from 'events';

class BaseIpc {
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
class IpcMain extends BaseIpc {
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
class IpcRenderer extends BaseIpc {
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


const getIpcs = function () {
  const event = new EventEmitter();
  const ipcMain = new IpcMain(event);
  const ipcRenderer = new IpcRenderer(event);
  return { ipcMain, ipcRenderer };
};

export default getIpcs;
