import path from 'path';
import fs from 'fs';
import Vue from 'vue';

import healthMsg from 'sagi-api/health/v1/health_pb';
import healthRpc from 'sagi-api/health/v1/health_grpc_pb';
import translationMsg from 'sagi-api/translation/v1/translation_pb';
import translationRpc from 'sagi-api/translation/v1/translation_grpc_pb';
import { TrainingData } from 'sagi-api/training/v1/training_pb';
import { TrainngClient } from 'sagi-api/training/v1/training_grpc_pb';

/* eslint-disable */
const grpc = require('grpc');
/* eslint-enable */


class Sagi {
  constructor() {
    const sslCreds = grpc.credentials.createSsl(
      // How to access resources with fs see:
      // https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
      fs.readFileSync(path.join(__static, '/certs/ca.pem')),
      fs.readFileSync(path.join(__static, '/certs/key.pem')),
      fs.readFileSync(path.join(__static, '/certs/cert.pem')),
    );
    const metadataUpdater = (_, cb) => {
      const metadata = new grpc.Metadata();
      metadata.set('uuid', Vue.http.headers.common['X-Application-Token']);
      metadata.set('agent', Vue.http.headers.common['User-Agent']);
      Vue.http.get('https://ip.xindong.com/myip').then((response) => {
        metadata.set('clientip', response.bodyText);
        cb(null, metadata);
      }, () => {
        cb(null, metadata);
      });
    };
    const metadataCreds = grpc.credentials.createFromMetadataGenerator(metadataUpdater);
    const combinedCreds = grpc.credentials.combineChannelCredentials(sslCreds, metadataCreds);
    this.creds = combinedCreds;

    if (process.env.NODE_ENV === 'production') {
      this.endpoint = 'apis.sagittarius.ai:8443';
    } else {
      this.endpoint = 'apis.stage.sagittarius.ai:8443';
      // this.endpoint = '127.0.0.1:8443'; // uncomment this when debuging
    }
    this.transcripts = [];
  }

  mediaTranslateRaw(mediaIdentity, languageCode, hints) {
    return new Promise((resolve, reject) => {
      const client = new translationRpc.TranslationClient(this.endpoint, this.creds);
      const req = new translationMsg.MediaTranslationRequest();
      req.setMediaIdentity(mediaIdentity);
      req.setLanguageCode(languageCode);
      req.setHints(hints);
      client.translateMedia(req, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  mediaTranslate({ mediaIdentity, languageCode, hints }) {
    if (!languageCode) {
      languageCode = 'zh';
      console.warn('No languageCode provided, falling back to zh.');
    }
    return new Promise((resolve, reject) => {
      this.mediaTranslateRaw(mediaIdentity, languageCode, hints).then((response) => {
        const { error, resultsList } = response.toObject();
        if (error && error.code) reject(error);
        resolve(resultsList);
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
        }
        resolve(res);
      });
    });
  }

  getTranscript({ transcriptIdentity }) {
    return new Promise((resolve, reject) => {
      this.getTranscriptRaw(transcriptIdentity).then((response) => {
        const { error, transcriptsList } = response.toObject();
        if (error && error.code) reject(error);
        resolve(transcriptsList);
      }, reject);
    });
  }

  pushTranscriptRawWithPayload(
    mediaIdentity,
    languageCode,
    format,
    playedTime,
    totalTime,
    delay,
    hints,
    payload,
  ) {
    return new Promise((resolve, reject) => {
      const client = new TrainngClient(this.endpoint, this.creds);
      const req = new TrainingData();
      req.setMediaIdentity(mediaIdentity);
      req.setLanguageCode(languageCode);
      req.setFormat(format);
      req.setPlayedTime(playedTime);
      req.setTotalTime(totalTime);
      req.setDelay(delay);
      req.setHints(hints);
      req.setPayload(payload);
      client.pushData(req, (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }

  pushTranscriptRawWithTranscriptIdentity(
    mediaIdentity,
    languageCode,
    format,
    playedTime,
    totalTime,
    delay,
    hints,
    transcriptIdentity,
  ) {
    return new Promise((resolve, reject) => {
      const client = new TrainngClient(this.endpoint, this.creds);
      const req = new TrainingData();
      req.setMediaIdentity(mediaIdentity);
      req.setLanguageCode(languageCode);
      req.setFormat(format);
      req.setPlayedTime(playedTime);
      req.setTotalTime(totalTime);
      req.setDelay(delay);
      req.setHints(hints);
      req.setTranscriptIdentity(transcriptIdentity);
      client.pushData(req, (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }

  pushTranscript(transcriptInfo) {
    const {
      mediaIdentity,
      languageCode,
      format,
      playedTime,
      totalTime,
      delay,
      hints,
      transcriptIdentity,
      payload,
    } = transcriptInfo;
    return new Promise((resolve, reject) => {
      if (!mediaIdentity) reject(new Error('Missing mediaIdentity.'));
      if (!transcriptIdentity && !payload) reject(new Error('Missing transcriptIdentity or payload.'));
      if (payload) {
        this.pushTranscriptRawWithPayload(
          mediaIdentity,
          languageCode,
          format,
          playedTime,
          totalTime,
          delay,
          hints,
          payload,
        ).then((res) => {
          const resAsObject = res.toObject();
          if (resAsObject.code) reject(resAsObject);
          resolve(resAsObject);
        });
      } else {
        this.pushTranscriptRawWithTranscriptIdentity(
          mediaIdentity,
          languageCode,
          format,
          playedTime,
          totalTime,
          delay,
          hints,
          transcriptIdentity,
        ).then((res) => {
          const resAsObject = res.toObject();
          if (resAsObject.code) reject(resAsObject);
          resolve(resAsObject);
        });
      }
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
