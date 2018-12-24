import path from 'path';
import fs from 'fs';
import { get, partialRight, flow, nth } from 'lodash';

import healthMsg from 'sagi-api/health/v1/health_pb';
import healthRpc from 'sagi-api/health/v1/health_grpc_pb';
import translationMsg from 'sagi-api/translation/v1/translation_pb';
import translationRpc from 'sagi-api/translation/v1/translation_grpc_pb';
import { TrainingData } from 'sagi-api/training/v1/training_pb';
import { TrainngClient } from 'sagi-api/training/v1/training_grpc_pb';

/* eslint-disable */
const grpc = require('grpc');
/* eslint-enable */

const getResponseArray = flow(partialRight(get, 'array'), partialRight(nth, 1));

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
      // this.endpoint = '127.0.0.1:8443'; // use this when debuging server
      this.endpoint = 'apis.stage.sagittarius.ai:8443';
    }
    this.transcripts = [];
  }

  mediaTranslateRaw(mediaIdentity, languageCode) {
    return new Promise((resolve, reject) => {
      const client = new translationRpc.TranslationClient(this.endpoint, this.creds);
      const req = new translationMsg.MediaTranslationRequest();
      req.setMediaIdentity(mediaIdentity);
      if (!languageCode || languageCode.length === 0) {
        console.log('warning: empty languageCode in mediaTranslate, fail back to "zh"');
        languageCode = 'zh';
      }
      req.setLanguageCode(languageCode);
      client.translateMedia(req, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  mediaTranslate(mediaIdentity, languageCode) {
    return new Promise((resolve, reject) => {
      this.mediaTranslateRaw(mediaIdentity, languageCode).then((response) => {
        const transcriptInfo = array => ({
          transcript_identity: array[0],
          language_code: array[1] || 'unknown',
          ranking: array[2] || -1,
          tags: array[3] || [],
          delay: array[4] || 0,
        });
        resolve(getResponseArray(response).map(transcriptInfo));
      }, reject);
    });
  }

  getTranscriptRaw(transcriptIdentity) {
    return new Promise((resolve, reject) => {
      const client = new translationRpc.TranslationClient(this.endpoint, this.creds);
      const req = new translationMsg.TranscriptRequest();
      req.setTranscriptIdentity(transcriptIdentity);
      client.transcript(req, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  getTranscript(transcriptIdentity) {
    return new Promise((resolve, reject) => {
      this.getTranscriptRaw(transcriptIdentity).then((response) => {
        resolve(getResponseArray(response));
      }, reject);
    });
  }

  pushTranscript(transcriptData) {
    return new Promise((resolve, reject) => {
      const client = new TrainngClient(this.endpoint, this.creds);
      const req = new TrainingData();
      req.setMediaIdentity(transcriptData.media_identity);
      req.setLanguageCode(transcriptData.language_code);
      req.setFormat(transcriptData.format);
      req.setPlayedTime(transcriptData.played_time);
      req.setTotalTime(transcriptData.total_time);
      req.setDelay(transcriptData.delay);
      if (transcriptData.payload !== undefined && transcriptData.payload !== null) {
        req.setPayload(transcriptData.payload);
      } else if (transcriptData.transcript_identity !== undefined
          && transcriptData.transcript_identity !== null) {
        req.setTranscriptIdentity(transcriptData.transcript_identity);
      } else {
        const err = new Error('missing transcript payload and transcript_identity');
        reject(err);
      }
      client.pushData(req, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  // check sagi-api health, return UNKNOWN(0), SERVING(1) or XXXXX
  healthCheck() {
    return new Promise((resolve, reject) => {
      const client = new healthRpc.HealthClient(this.endpoint, this.creds);
      client.check(new healthMsg.HealthCheckRequest(), (err, response) => {
        if (err) {
          reject(err);
        } else {
          console.log(`sagi version ${response.getVersion()}`);
          resolve(response.getStatus());
        }
      });
    });
  }
}

export default new Sagi();
