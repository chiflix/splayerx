export class UpdateInfo {
  constructor(version, description) {
    this.version = version;
    this.description = description;
  }

  // todo
  static getFromUpdaterUpdateInfo(info) {
    return new UpdateInfo(info.version, info.note);
  }

  static getFromStorageString(infoString) {
    const info = JSON.parse(infoString);
    return new UpdateInfo(info.version, info.note);
  }

  toString() {
    return JSON.stringify(this);
  }

  after(next) {
    if (!next) return true;
    return this.version > next.version;
  }

  equalTo(next) {
    if (!next) return false;
    return this.version === next.version;
  }
}


class Message {
  static getFromMessage(arg) {
    const message = JSON.parse(arg);
    return new Message(message.title, message.body);
  }

  constructor(title, body) {
    this.title = title;
    this.body = body;
  }
}

export class UpdaterMessage extends Message {
  static getFromMessage(arg) {
    const message = JSON.parse(arg);
    return new UpdaterMessage(message.title, message.body);
  }

  static installedMessageLastRoundTitle = 'hasInstalledTitle';

  static toInstallMessageNowTitle = 'toInstallTitle';

  static willInstallOrNotTitle = 'willInstall';

  static rendererReadyTitle = 'rendererOkay';

  toString() {
    return JSON.stringify(this);
  }
}
