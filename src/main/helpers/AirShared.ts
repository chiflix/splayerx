import { OpenDialogReturnValue, splayerx, dialog } from 'electron';
import path from 'path';
import http from 'http';
import fs from 'fs';
import os from 'os';

import { getValidVideoExtensions } from '../../shared/utils';

function getLocalIP(): string[] {
  const ips: string[] = [];
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname].forEach((iface) => {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
      ips.push(iface.address);
    });
  });
  return ips;
}

class AirShared {
  private httpServer: http.Server;

  private enableAirShared: boolean = false;

  public isServiceEnable(): boolean {
    return this.enableAirShared;
  }

  // eslint-disable-next-line
  public onClickAirShared(menuService: any) {
    if (process.platform !== 'darwin') return;
    if (!this.enableAirShared) {
      dialog.showOpenDialog({
        title: 'Air Shared',
        filters: [{
          name: 'Video Files',
          extensions: getValidVideoExtensions(),
        }, {
          name: 'All Files',
          extensions: ['*'],
        }],
        properties: ['openFile'],
        securityScopedBookmarks: process.mas,
      }).then((ret: OpenDialogReturnValue) => {
        if (ret.filePaths.length > 0) {
          this.enableAirShared = !this.enableAirShared;
          // start air shared
          this.enableService(ret.filePaths[0]);
        } else {
          menuService.updateMenuItemChecked('file.airShared', false);
        }
      }).catch((error: Error) => {
        console.error('trying to start AirShared.', error);
      });
    } else { // stop air shared
      this.enableAirShared = !this.enableAirShared;
      this.disableService();
    }
  }

  public onAppExit() {
    this.disableService();
    this.enableAirShared = false;
  }

  private enableService(sharedfile: string) {
    if (process.platform !== 'darwin') return;
    const serverUrl = this.startHttpServer(sharedfile);
    if (serverUrl !== '') {
      console.info('enable shared service for file: ', serverUrl);
      splayerx.startBluetoothService(serverUrl);
    }
  }

  private disableService() {
    if (process.platform !== 'darwin') return;
    console.info('disable shared service.');
    if (this.httpServer) {
      this.httpServer.close();
    }
    splayerx.stopBluetoothService();
  }

  private startHttpServer(sharedfile: string): string {
    const sharedfilename = path.basename(sharedfile);
    const ips = getLocalIP();
    if (ips.length <= 0) {
      return '';
    }

    const port = 62020;
    const host = ips[0];

    this.httpServer = http.createServer((req, res) => {
      const filename = req.url != null ? path.basename(req.url) : null;
      if (filename === encodeURI(sharedfilename) && fs.existsSync(sharedfile)) {
        res.setHeader('content-disposition', `attachment; filename="${sharedfilename}"`);
        fs.createReadStream(sharedfile).pipe(res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.httpServer.listen(port, host);
    return encodeURI(`http://${host}:${port}/${sharedfilename}`);
  }
}

const airSharedInstance = new AirShared();
export default airSharedInstance;
