const p = {};

// 前後の文字をワイルドカード指定した汎用のカーニングペア
p['*う'] = -0.03;
p['う*'] = -0.02;
p['*く'] = -0.075;
p['く*'] = -0.075;
p['*し'] = -0.075;
p['し*'] = -0.075;
p['*ぁ'] = -0.05;
p['ぁ*'] = -0.075;
p['*ぃ'] = -0.05;
p['ぃ*'] = -0.075;
p['*ぅ'] = -0.05;
p['ぅ*'] = -0.075;
p['*ぇ'] = -0.05;
p['ぇ*'] = -0.075;
p['*ぉ'] = -0.05;
p['ぉ*'] = -0.075;
p['*っ'] = -0.075;
p['っ*'] = -0.075;
p['*ゃ'] = -0.05;
p['ゃ*'] = -0.075;
p['*ゅ'] = -0.05;
p['ゅ*'] = -0.075;
p['*ょ'] = -0.075;
p['ょ*'] = -0.075;
p['*ト'] = -0.075;
p['ト*'] = -0.075;
p['*ド'] = -0.075;
p['ド*'] = -0.075;
p['*リ'] = -0.075;
p['リ*'] = -0.075;
p['*ッ'] = -0.05;
p['ッ*'] = -0.075;
p['ャ*'] = -0.05;
p['*ャ'] = -0.05;
p['ュ*'] = -0.05;
p['*ュ'] = -0.05;
p['ョ*'] = -0.08;
p['*ョ'] = -0.08;
p['*「'] = -0.25;
p['」*'] = -0.25;
p['*（'] = -0.25;
p['）*'] = -0.25;
p['、*'] = -0.25;
p['。*'] = -0.25;
p['・*'] = -0.25;
p['*・'] = -0.25;
p['*：'] = -0.25;
p['：*'] = -0.25;

// 直接指定のカーニングペア
p['して'] = -0.12;
p['す。'] = -0.15;
p['タク'] = -0.12;
p['タグ'] = -0.12;
p['ット'] = -0.2;
p['ラム'] = -0.1;
p['プル'] = -0.1;
p['ンプ'] = -0.15;
p['ング'] = -0.05;
p['ード'] = -0.15;
p['」「'] = -0.75;
p['」。'] = -0.25;
p['」、'] = -0.25;
p['、「'] = -0.75;
p['。「'] = -0.75;
p['、『'] = -0.75;
p['。『'] = -0.75;
p['、（'] = -0.75;
p['。（'] = -0.75;

// 1文字は行頭専用のカーニングペア
p['「'] = -0.5;
p['『'] = -0.5;
p['（'] = -0.5;
p['【'] = -0.5;
p['“'] = -0.5;

export default function kern(createElement, text) { // eslint-disable-line complexity
  const result = [];
  const n = text.length;
  for (let i = 0; i < n; i += 1) {
    const char = text.substr(i, 1);
    const nextChar = text.substr(i + 1, 1);
    let char2 = char;
    let space = 0;

    if (p[char + nextChar]) {
      // 明示的なカーニングペアの処理
      space = p[char + nextChar];
    } else {
      // 汎用カーニングペアの処理
      if (p[`${char}*`]) space += p[`${char}*`];
      if (p[`*${nextChar}`]) space += p[`*${nextChar}`];
    }
    if (space !== 0) {
      char2 = createElement(
        'span',
        { style: { letterSpacing: `${space}em` } },
        char,
      );
    }

    // 行頭約物の処理
    if (i === 0 && p[char]) {
      char2 = [
        createElement('span', { style: { marginLeft: `${p[char]}em` } }, ''),
        char2,
      ];
    }

    if (
      !result.length ||
      typeof result[result.length - 1] !== 'string' ||
      typeof char2 !== 'string'
    ) {
      result.push(char2);
    } else {
      result[result.length - 1] = result[result.length - 1] + char2;
    }

    if ((/[\u3000-\u9fa5가-힝]/.test(char) && /[a-zA-Z0-9]/.test(nextChar))
    || (/[\u3000-\u9fa5가-힝]/.test(nextChar) && /[a-zA-Z0-9]/.test(char))) {
      result.push(createElement('span', { style: { marginLeft: '0.3em' } }));
    }
  }
  return result;
}
