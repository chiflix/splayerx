export default function sortVideoFile(videoFile1: string, videoFile2: string) {
  if (videoFile1.includes('.')) videoFile1 = videoFile1.substring(0, videoFile1.indexOf('.'));
  if (videoFile2.includes('.')) videoFile2 = videoFile2.substring(0, videoFile2.indexOf('.'));

  let value1 = 0;
  let value2 = 0;

  const numbersInA = videoFile1.match(/\d+/g);
  const numbersInB = videoFile2.match(/\d+/g);

  if (numbersInA !== null) value1 = parseInt(numbersInA.join(''), 10);
  if (numbersInB !== null) value2 = parseInt(numbersInB.join(''), 10);

  return value1 - value2;
}
