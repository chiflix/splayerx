import { IStorage } from "@/interfaces/IStorage";
import path from 'path';
// @ts-ignore
import storage from 'electron-json-storage';
import { readDir } from "./file";

export default class JStorage implements IStorage {
  get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      storage.get(key, (err: Error, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
  set(key: string, json: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      storage.set(key, json, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
  async clear(): Promise<any> {
    const dirPath = storage.getDataPath();
    const taskArray: any[] = [];
    try {
      const files = await readDir(dirPath);
      files.forEach((file) => {
        taskArray.push(new Promise((resolve) => {
          storage.remove(path.basename(file), () => {
            resolve();
          });
        }));
      });
      return Promise.all(taskArray);
    } catch (error) {
    }
  }
}

export const jStorage = new JStorage()