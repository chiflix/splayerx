import path from 'path';
import fs from 'fs';
import healthMsg from 'sagi-apis-client/health/v1/health_pb';
import healthRpc from 'sagi-apis-client/health/v1/health_grpc_pb';
import translationMsg from 'sagi-apis-client/translation/v1/translation_pb';
import translationRpc from 'sagi-apis-client/translation/v1/translation_grpc_pb';
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

  mediaTranslate(mediaIdentity) {
    return new Promise((resolve, reject) => {
      const client = new translationRpc.TranslationClient(this.endpoint, this.creds);
      const req = new translationMsg.MediaTranslationRequest();
      req.setMediaIdentity(mediaIdentity);
      client.translateMedia(req, (err, response) => {
        if (err) {
          reject(err);
        } else {
          // TODO: fetch real transcripts
          resolve(response);
        }
      });
    });
  }

  // check sagi-api health, return UNKNOWN(0), SERVING(1) or XXXXX
  healthCheck() {
    return new Promise((resolve, reject) => {
      const client = new healthRpc.HealthClient(this.endpoint, this.creds);
      client.check(new healthMsg.HealthCheckRequest(), (err, response) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(response.getStatus());
        }
      });
    });
  }
}

export default new Sagi();
