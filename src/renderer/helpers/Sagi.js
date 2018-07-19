import grpc from 'grpc';
import path from 'path';
import fs from 'fs';
import sagiHealthMessages from 'sagi-apis-client/health/v1/health_pb';
import sagiHealthServices from 'sagi-apis-client/health/v1/health_grpc_pb';

class Sagi {
  constructor(sslCreds) {
    this.creds = sslCreds;
  }

  healthCheck(cb) {
    const client = new sagiHealthServices.HealthClient('apis.sagittarius.ai:8443', this.creds);
    client.check(new sagiHealthMessages.HealthCheckRequest(), cb);
  }
}

export default new Sagi(grpc.credentials.createSsl(
// How to access resources with fs see:
// https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
  fs.readFileSync(path.join(__static, '/certs/ca.pem')),
  fs.readFileSync(path.join(__static, '/certs/key.pem')),
  fs.readFileSync(path.join(__static, '/certs/cert.pem')),
));
