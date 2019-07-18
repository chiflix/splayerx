import path from 'path';
import fs from 'fs';
import { credentials, Metadata } from 'grpc';
import Vue from 'vue';

import { HealthCheckRequest, HealthCheckResponse } from 'sagi-api/health/v1/health_pb';
import { HealthClient } from 'sagi-api/health/v1/health_grpc_pb';
import { MediaTranslationRequest, MediaTranslationResponse, TranscriptRequest } from 'sagi-api/translation/v1/translation_pb';
import { TranslationClient } from 'sagi-api/translation/v1/translation_grpc_pb';
import { TrainingData } from 'sagi-api/training/v1/training_pb';
import { TrainngClient } from 'sagi-api/training/v1/training_grpc_pb';
import { SagiSubtitlePayload } from '@/services/subtitle';
import { log } from './Log';

class Sagi {
  private creds: unknown;

  private endpoint = process.env.NODE_ENV === 'production'
    ? 'apis.sagittarius.ai:8443'
    : 'apis.stage.sagittarius.ai:8443';

  // '127.0.0.1:8443'; // uncomment this when debuging
  public constructor() {
    const sslCreds = credentials.createSsl(
      // How to access resources with fs see:
      // https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
      fs.readFileSync(path.join(__static, '/certs/ca.pem')),
      fs.readFileSync(path.join(__static, '/certs/key.pem')),
      fs.readFileSync(path.join(__static, '/certs/cert.pem')),
    );
    const metadataUpdater = (_: unknown, cb: Function) => {
      const metadata = new Metadata();
      metadata.set('uuid', Vue.axios.defaults.headers.common['X-Application-Token']);
      metadata.set('agent', navigator.userAgent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Vue.axios.get('https://ip.xindong.com/myip', { responseType: 'text' }).then((response: any) => {
        metadata.set('clientip', response.bodyText);
        cb(null, metadata);
      }, () => {
        cb(null, metadata);
      });
    };
    const metadataCreds = credentials.createFromMetadataGenerator(metadataUpdater);
    const combinedCreds = credentials.combineChannelCredentials(sslCreds, metadataCreds);
    this.creds = combinedCreds;
  }

  public mediaTranslate(
    options: MediaTranslationRequest.AsObject,
  ): Promise<MediaTranslationResponse.TranscriptInfo.AsObject[]> {
    const { mediaIdentity, languageCode, hints } = options;
    const client = new TranslationClient(this.endpoint, this.creds);
    const req = new MediaTranslationRequest();
    req.setMediaIdentity(mediaIdentity);
    req.setLanguageCode(languageCode);
    req.setHints(hints);
    log.info('Sagi.mediaTranslate', `hash-${mediaIdentity}***language-${languageCode}***hints-${hints}`);
    return new Promise((resolve, reject) => {
      client.translateMedia(req, (err, res) => {
        if (err) reject(err);
        else resolve(res.toObject().resultsList);
      });
    });
  }

  public getTranscript(options: TranscriptRequest.AsObject): Promise<SagiSubtitlePayload> {
    const { transcriptIdentity } = options;
    const client = new TranslationClient(this.endpoint, this.creds);
    const req = new TranscriptRequest();
    req.setTranscriptIdentity(transcriptIdentity);
    return new Promise((resolve, reject) => {
      client.transcript(req, (err, res) => {
        if (err) reject(err);
        else resolve(res.toObject().transcriptsList);
      });
    });
  }

  public pushTranscriptWithPayload(options: TrainingData.AsObject) {
    const {
      mediaIdentity, languageCode, format, playedTime, totalTime, delay, hints, payload,
    } = options;
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
    return new Promise((resolve, reject) => {
      client.pushData(req, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  public pushTranscriptWithTranscriptIdentity(options: TrainingData.AsObject) {
    const {
      mediaIdentity, languageCode, format, playedTime, totalTime, delay, hints, transcriptIdentity,
    } = options;
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
    return new Promise((resolve, reject) => {
      client.pushData(req, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  // check sagi-api health, return UNKNOWN(0), SERVING(1) or XXXXX
  public healthCheck(): Promise<HealthCheckResponse.AsObject> {
    const client = new HealthClient(this.endpoint, this.creds);
    return new Promise((resolve, reject) => {
      client.check(new HealthCheckRequest(), (err, response) => {
        if (err) reject(err);
        else {
          const status = response.getStatus();
          console.log(`[Sagi]Version: ${response.getVersion()}, Status: ${status}.`);
          if (status !== HealthCheckResponse.ServingStatus.SERVING) {
            reject(HealthCheckResponse.ServingStatus[status]);
          } else resolve({ status, version: response.getVersion() });
        }
      });
    });
  }
}

export default new Sagi();
