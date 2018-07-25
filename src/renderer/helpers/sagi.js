import path from 'path';
import fs from 'fs';
import sagiHealthMessages from 'sagi-apis-client/health/v1/health_pb';
import sagiHealthServices from 'sagi-apis-client/health/v1/health_grpc_pb';

/* eslint-disable */
const grpc = require('grpc');
/* eslint-enable */

class Sagi {
  constructor() {
    this.apiStatus = 1;
  }

  healthCheck() {
    // check sagi-api health, return UNKNOWN(0), SERVING(1) or XXXXX

    return new Promise((resolve) => {
      const creds = grpc.credentials.createSsl(
        // How to access resources with fs see:
        // https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
        fs.readFileSync(path.join(__static, '/certs/ca.pem')),
        fs.readFileSync(path.join(__static, '/certs/key.pem')),
        fs.readFileSync(path.join(__static, '/certs/cert.pem')),
      );

      const client = new sagiHealthServices.HealthClient('apis.stage.sagittarius.ai:8443', creds);
      client.check(new sagiHealthMessages.HealthCheckRequest(), () => {
        resolve(this.apiStatus);
      });
    });
  }
}

export default new Sagi();
