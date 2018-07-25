import path from 'path';
import fs from 'fs';
import sagiHealthMessages from 'sagi-apis-client/health/v1/health_pb';
import sagiHealthServices from 'sagi-apis-client/health/v1/health_grpc_pb';
/* eslint-disable */
const grpc = require('grpc');
/* eslint-enable */

class Sagi {
  constructor() {
    this.creds = grpc.credentials.createSsl(
      // How to access resources with fs see:
      // https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
      fs.readFileSync(path.join(__static, '/certs/ca.pem')),
      fs.readFileSync(path.join(__static, '/certs/key.pem')),
      fs.readFileSync(path.join(__static, '/certs/cert.pem')),
    );
    if (process.env.NODE_ENV === 'production') {
      this.endpoint = 'apis.sagittarius.ai:8443';
    } else {
      this.endpoint = 'apis.stage.sagittarius.ai:8443';
    }
  }

  // check sagi-api health, return UNKNOWN(0), SERVING(1) or XXXXX
  healthCheck() {
    return new Promise((resolve, reject) => {
      const client = new sagiHealthServices.HealthClient(this.endpoint, this.creds);
      client.check(new sagiHealthMessages.HealthCheckRequest(), (err, response) => {
        if (response && response.getStatus()) {
          this.apiStatus = response.getStatus();
          resolve(this.apiStatus);
        } else {
          console.log(err);
          reject(err);
        }
      });
    });
  }
}

export default new Sagi();
