import { createHash } from 'crypto';
import { times } from 'lodash';
import { promises as fsPromises } from 'fs';

export async function mediaQuickHash(filePath: string) {
  function md5Hex(text: Buffer) {
    return createHash('md5').update(text).digest('hex');
  }
  const fileHandler = await fsPromises.open(filePath, 'r');
  const len = (await fsPromises.stat(filePath)).size;
  const position = [
    4096,
    Math.floor(len / 3),
    Math.floor(len / 3) * 2,
    len - 8192,
  ];
  const res = await Promise.all(times(4).map(async (i) => {
    const buf = Buffer.alloc(4096);
    const { bytesRead } = await fileHandler.read(buf, 0, 4096, position[i]);
    return md5Hex(buf.slice(0, bytesRead));
  }));
  fileHandler.close();
  return res.join('-');
}

export function timecodeFromSeconds(s: number) {
  const dt = new Date(Math.abs(s) * 1000);
  let hours: string | number = dt.getUTCHours();
  let minutes: string | number = dt.getUTCMinutes();
  let seconds: string | number = dt.getUTCSeconds();

  // the above dt.get...() functions return a single digit
  // so I prepend the zero here when needed
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  if (hours > 0) {
    if (hours < 10) {
      hours = `${hours}`;
    }
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${minutes}:${seconds}`;
}