import path from 'path';
import fs from 'fs';
import grpc, { credentials, Metadata } from 'grpc';
import { HealthCheckRequest, HealthCheckResponse } from 'sagi-api/health/v1/health_pb';
import { HealthClient } from 'sagi-api/health/v1/health_grpc_pb';
import {
  MediaTranslationRequest,
  TranscriptRequest,
  TranscriptInfo,
  StreamingTranslationTaskRequest,
  StreamingTranslationTaskResponse,
  StreamingTranslationRequest,
  StreamingTranslationRequestConfig,
} from 'sagi-api/translation/v1/translation_pb';
import { TranslationClient } from 'sagi-api/translation/v1/translation_grpc_pb';
import { TrainingData } from 'sagi-api/training/v1/training_pb';
import { TrainngClient } from 'sagi-api/training/v1/training_grpc_pb';
import { SagiTextSubtitlePayload } from '@/services/subtitle';
import { getClientUUID, getIP } from '@/../shared/utils';
import { log } from './Log';

export class Sagi {
  public static get endpoint() {
    return process.env.SAGI_API as string;
  }

  private creds: grpc.ChannelCredentials;

  public constructor() {
    this.creds = this.combinedCreds();
  }

  private combinedCreds(token?: string) {
    const sslCreds = credentials.createSsl(
      // How to access resources with fs see:
      // https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
      fs.readFileSync(path.join(__static, '/certs/ca.pem')),
      fs.readFileSync(path.join(__static, '/certs/key.pem')),
      fs.readFileSync(path.join(__static, '/certs/cert.pem')),
    );
    const metadataUpdater = (_: unknown, cb: Function) => {
      Promise.all([getClientUUID(), getIP()]).then(([uuid, ip]) => {
        const metadata = new Metadata();
        metadata.set('uuid', uuid);
        metadata.set('agent', navigator.userAgent);
        metadata.set('clientip', ip);
        if (token) {
          metadata.set('token', token);
        }
        cb(null, metadata);
      });
    };
    const metadataCreds = credentials.createFromMetadataGenerator(metadataUpdater);
    return credentials.combineChannelCredentials(sslCreds, metadataCreds);
  }

  public setToken(token: string) {
    this.creds = this.combinedCreds(token);
  }

  public mediaTranslate(
    options: MediaTranslationRequest.AsObject,
  ): Promise<TranscriptInfo.AsObject[]> {
    const { mediaIdentity, languageCode, hints } = options;
    const client = new TranslationClient(Sagi.endpoint, this.creds);
    const req = new MediaTranslationRequest();
    req.setMediaIdentity(mediaIdentity);
    req.setLanguageCode(languageCode);
    req.setHints(hints);
    log.info('Sagi.mediaTranslate', `hash-${mediaIdentity}***language-${languageCode}***hints-${hints}`);
    return new Promise((resolve, reject) => {
      client.translateMedia(req, (err, res) => {
        log.debug('Sagi.mediaTranslate', res && res.toObject());
        if (err) reject(err);
        else resolve(res.toObject().resultsList);
      });
    });
  }

  public getTranscript(options: TranscriptRequest.AsObject): Promise<SagiTextSubtitlePayload> {
    const { transcriptIdentity } = options;
    const client = new TranslationClient(Sagi.endpoint, this.creds);
    const req = new TranscriptRequest();
    req.setTranscriptIdentity(transcriptIdentity);
    return new Promise((resolve, reject) => {
      client.transcript(req, (err, res) => {
        log.debug('Sagi.getTranscript', res && res.toObject());
        if (err) reject(err);
        else resolve(res.toObject().transcriptsList);
      });
    });
  }

  public pushTranscriptWithPayload(options: TrainingData.AsObject) {
    const {
      mediaIdentity, languageCode, format, playedTime, totalTime, delay, hints, payload,
    } = options;
    const client = new TrainngClient(Sagi.endpoint, this.creds);
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
    const client = new TrainngClient(Sagi.endpoint, this.creds);
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
    const client = new HealthClient(Sagi.endpoint, this.creds);
    return new Promise((resolve, reject) => {
      client.check(new HealthCheckRequest(), (err, response) => {
        if (err) reject(err);
        else {
          const status = response.getStatus();
          log.info('sagi', `[Sagi]Version: ${response.getVersion()}, Status: ${status}.`);
          if (status !== HealthCheckResponse.ServingStatus.SERVING) {
            reject(HealthCheckResponse.ServingStatus[status]);
          } else resolve({ status, version: response.getVersion() });
        }
      });
    });
  }

  public streamingTranslation(
    mediaIdentity: string,
    rate: number,
    audioLanguageCode: string,
    targetLanguageCode: string,
  ): any { // eslint-disable-line

    const request = new StreamingTranslationRequest();
    const requestConfig = new StreamingTranslationRequestConfig();
    // @ts-ignore
    const audioConfig = new global.proto.google.cloud.speech.v1
      .RecognitionConfig([1, rate, audioLanguageCode]);
    requestConfig.setStreamingConfig(audioConfig);
    requestConfig.setAudioLanguageCode(audioLanguageCode);
    requestConfig.setTargetLanguageCode(targetLanguageCode);
    requestConfig.setMediaIdentity(mediaIdentity);
    request.setStreamingConfig(requestConfig);
    const client = new TranslationClient(Sagi.endpoint, this.creds);
    const stream = client.streamingTranslation();
    stream.write(request);
    return stream;
  }

  public streamingTranslationTask(
    taskId: string,
  ): Promise<StreamingTranslationTaskResponse> {
    const client = new TranslationClient(Sagi.endpoint, this.creds);
    const taskRequest = new StreamingTranslationTaskRequest();
    taskRequest.setTaskId(taskId);
    return new Promise((resolve, reject) => {
      const onlineTimeoutId = setTimeout(() => {
        reject(new Error('time out'));
      }, 1000 * 10);
      client.streamingTranslationTask(taskRequest, (err, res) => {
        clearTimeout(onlineTimeoutId);
        if (err) reject(err);
        else resolve(res);
      });
    });
  }
}

export default new Sagi();
