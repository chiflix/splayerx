import { splayerx } from 'electron';
import path from 'path';
import http from 'http';
import fs from 'fs';
import os from 'os';

function getLocalIP() : string[] {
  var ips : string[] = [];
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
  
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
  
      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log(ifname + ':' + alias, iface.address);
        ips.push(iface.address);
      } else {
        // this interface has only one ipv4 adress
        console.log(ifname, iface.address);
        ips.push(iface.address);
      }
      ++alias;
    });
  });

  return ips;
}

class AirShared {
  private httpServer: http.Server

  public enableService(sharedfile: string) {
    var serverUrl = this.startHttpServer(sharedfile);
    console.log('enable shared service for file: ', serverUrl);
    splayerx.startBluetoothService(serverUrl);
  }

  public disableService() {
    console.log('disable shared service.');
    this.httpServer.close();
    splayerx.stopBluetoothService();
  }

  private startHttpServer(sharedfile: string) : string {
    var sharedfilename = path.basename(sharedfile);
    var ips = getLocalIP();
    if (ips.length == 0) {
      return '';
    }

    var port = 62020;
    var host = ips[0];

    this.httpServer = http.createServer((req, res) => {
        var filename = path.basename(req.url);
        console.log('--->', filename, fs.existsSync(sharedfile));
        if (filename === sharedfilename && fs.existsSync(sharedfile)) {
          res.setHeader("content-disposition", 'attachment; filename="' + sharedfilename +'"');
          fs.createReadStream(sharedfile).pipe(res);
        } else {
          res.writeHead(404);
          res.end();
        }
      });
    
    this.httpServer.listen(port, host);
    return 'http://'+host+':'+port+'/'+sharedfilename;
  }
}

const airSharedInstance = new AirShared();
export default airSharedInstance;
