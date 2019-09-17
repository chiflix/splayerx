import path from 'path';

function compareArray(arr1: string[], arr2: string[]) {
  for (let i = 0; i < arr1.length; i += 1) {
    const item1 = arr1[i];
    const item2 = arr2[i];
    if (item1 !== item2) {
      const int1 = parseInt(item1, 10);
      const int2 = parseInt(item2, 10);
      if (!Number.isNaN(int1) && !Number.isNaN(int2)) return int1 < int2;
      return item1 < item2;
    }
  }
  return true;
}

export default function sortVideoFile(videoFile1: string, videoFile2: string) {
  const parts1 = path.basename(videoFile1).split(/(?<=\D)(?=\d)|(?<=\d)(?=\D)/);
  const parts2 = path.basename(videoFile2).split(/(?<=\D)(?=\d)|(?<=\d)(?=\D)/);
  return compareArray(parts1, parts2) ? -1 : 1;
}
