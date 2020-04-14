import { splayerx } from 'electron';
import path from 'path';
import http from 'http';
import fs from 'fs';
import os from 'os';

function getLocalIP(): string[] {
  const ips: string[] = [];
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach((ifname) => {
    let alias = 0;

    ifaces[ifname].forEach((iface) => {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        ips.push(iface.address);
      } else {
        // this interface has only one ipv4 adress
        ips.push(iface.address);
      }
      alias += 1;
    });
  });

  return ips;
}

class AirShared {
  private httpServer: http.Server

  public enableService(sharedfile: string) {
    if (process.platform !== 'darwin') return;
    const serverUrl = this.startHttpServer(sharedfile);
    if (serverUrl !== '') {
      console.log('enable shared service for file: ', serverUrl);
      splayerx.startBluetoothService(serverUrl);
    }
  }

  public disableService() {
    if (process.platform !== 'darwin') return;
    console.log('disable shared service.');
    this.httpServer.close();
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
      if (filename === sharedfilename && fs.existsSync(sharedfile)) {
        res.setHeader('content-disposition', `attachment; filename="${sharedfilename}"`);
        fs.createReadStream(sharedfile).pipe(res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.httpServer.listen(port, host);
    return `http://${host}:${port}/${sharedfilename}`;
  }
}

const airSharedInstance = new AirShared();
export default airSharedInstance;
