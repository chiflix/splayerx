/* eslint-disable @typescript-eslint/no-explicit-any */

type Err = string | Error | NodeJS.ErrnoException;

declare module 'regedit' {
  export function setExternalVBSLocation(file: string): void;
  export function list(
    path: string,
    cb: (err: Err, result: {}) => void,
  ): void;
}

declare module '@splayer/electron-json-storage' {
  export function get(
    key: string,
    cb: (err: Err, result: any) => void,
  ): void;
  export function set(
    key: string,
    val: any,
    cb?: (err: Err, result: any) => void,
  ): void;
  export function remove(
    key: string,
    cb?: (err: Err, result: any) => void,
  ): void;
  export function getDataPath(): string;
}
