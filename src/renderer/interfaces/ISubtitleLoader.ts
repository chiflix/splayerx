import {
  IOrigin, Type,
} from '@/interfaces/ISubtitle';

export interface IEmbeddedOrigin extends IOrigin {
  type: Type.Embedded;
  source: {
    videoPath: string;
    streamIndex: number;
  };
}
