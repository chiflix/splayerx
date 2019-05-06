import { toVttTime } from 'subtitle';

export * from './searchers';
export * from './storage';

function toHHMMSS(num) {
  const secNum = parseFloat(num, 10); // don't forget the second param
  const hours = Math.floor(secNum / 3600);
  let minutes = Math.floor((secNum - (hours * 3600)) / 60);
  let seconds = secNum - (hours * 3600) - (minutes * 60);
  seconds = seconds.toFixed(2);
  // hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${hours}:${minutes}:${seconds}`;
}

function generateCurrentCueToRaw(currentCue) { // eslint-disable-line
  const slice = currentCue.slices[0];
  const pos = currentCue.pos;
  const clip = currentCue.clip;
  const fade = currentCue.fade;
  const fragment = slice.fragments[0];
  const tag = fragment.tag;
  const text = fragment.text ? fragment.text : '';
  let c1s = '', // eslint-disable-line
    bes = '',
    fades = '',
    poss = '',
    clips = '',
    ts = '';
  if (Object.keys(tag).length !== 0) {
    if (tag.c1) {
      c1s = `{\
        1c&H${tag.c}&}`;
    }
    if ('be' in tag || 'fscx' in tag || 'fscy' in tag) {
      bes = `{${'be' in tag ? `be${tag.be}` : ''}${'fscx' in tag ? `\fscx${tag.fscx}` : ''}${'fscy' in tag ? `\fscy${tag.fscy}` : ''}}`;
    }
    if (fade && Object.keys(fade).length !== 0) {
      fades = `{\
        ${fade.type}(${fade.t1},${fade.t2})}`;
    }
    if (pos && Object.keys(pos).length !== 0) {
      poss = `{\
        pos(${pos.x},${pos.y})}`;
    }
    if (clip && Object.keys(clip).length !== 0) {
      clips = `{\
        clip(${clip.x1},${clip.y1},${clip.x2},${clip.y2})}`;
    }
    if (tag.t && tag.t.length !== 0) {
      const t = tag.t;
      ts = `{\
        t(${t.t1},${t.t2},\fscx${t.tag.fscx},\fscy${t.tag.fscy})}`;
    }
  }
  return `Dialogue: ${currentCue.layer},${toHHMMSS(currentCue.start)},${toHHMMSS(currentCue.end)},${slice.name},,0,0,0,,${c1s}${bes}${fades}${poss}${clips}${ts}${text}`;
}

// function generateEvents(events) {
//   events.map((e) => {
//     return generateCurrentCueToRaw(e);
//   });
// }

/**
 * @description 将ass字幕数组，拼接成字符
 * @author tanghaixiang@xindong.com
 * @date 2019-04-30
 * @export
 * @param {Object} subtitle
 * @returns String
 */
export function stringifyAss(subtitle) {
  return generateCurrentCueToRaw(subtitle);
}

/**
 * @description 将单个字幕拼接成vtt格式的字幕
 * @author tanghaixiang@xindong.com
 * @date 2019-04-30
 * @export
 * @param {Object} subtitle 单条字幕的信息
 * @returns String
 */
export function stringifyVtt(subtitle) {
  // todo text with style
  let start = (subtitle.start * 1).toFixed(3);
  let end = (subtitle.end * 1).toFixed(3);
  start = toVttTime(start * 1000);
  end = toVttTime(end * 1000);
  const text = !subtitle.fragments ? subtitle.text :
    subtitle.fragments.filter(e => e.text).map(e => e.text.split('<br>').join('\n')).join('\n');
  return `${start} --> ${end}\n${text}`;
}

/**
 * @description 将字幕数组转成字符
 * @author tanghaixiang@xindong.com
 * @date 2019-04-30
 * @export
 * @param {Array} dialogues
 * @returns String
 */
export function dialogueToString(dialogues) {
  return dialogues.map((e, i) => `\n${i + 1}\n${stringifyVtt(e)}`).join('\n');
}
