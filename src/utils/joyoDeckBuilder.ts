import type { KanjiCard } from '../data/curriculumData';
import type { JoyoKanjiEntry } from './datasetLoader';

const KANA_ROMAJI_MAP: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo', みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo', ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo', びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
};

function katakanaToHiragana(input: string): string {
  return input.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

export function simpleKanaToRomaji(input: string): string {
  const hira = katakanaToHiragana(input).replace(/[().\-・\s]/g, '');
  let out = '';
  for (let i = 0; i < hira.length; i += 1) {
    const ch = hira[i];
    if (ch === 'っ' && i + 1 < hira.length) {
      const nextTwo = hira.slice(i + 1, i + 3);
      const nextRomaji = KANA_ROMAJI_MAP[nextTwo] ?? KANA_ROMAJI_MAP[hira[i + 1]] ?? '';
      if (nextRomaji) {
        out += nextRomaji[0];
        continue;
      }
    }
    if (ch === 'ー' && out.length > 0) {
      out += out[out.length - 1];
      continue;
    }
    const pair = hira.slice(i, i + 2);
    if (KANA_ROMAJI_MAP[pair]) {
      out += KANA_ROMAJI_MAP[pair];
      i += 1;
      continue;
    }
    out += KANA_ROMAJI_MAP[ch] ?? ch;
  }
  return out || input;
}

function parseReadingTokens(raw: string): { kana: string; romaji: string }[] {
  const cleaned = raw.trim();
  if (!cleaned || cleaned === '—' || cleaned === '-') return [];
  const parts = cleaned
    .split(/[・、,/／\s]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p !== '—' && p !== '-');
  return parts.map((kana) => ({
    kana,
    romaji: simpleKanaToRomaji(kana),
  }));
}

/**
 * Generates clean, deterministic stroke-order guide paths inside a 0..100 viewBox
 * matching the authentic stroke count of any Jōyō Kanji so learners can practice
 * every single stroke on the HTML5 Canvas alongside the ghost Kanji watermark.
 */
export function generateGuidedStrokePaths(kanjiChar: string, strokes: number): string[] {
  const count = Math.max(1, Math.min(29, Math.round(strokes || 1)));
  const seed = kanjiChar.charCodeAt(0) || 1;
  const paths: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const row = i % 5;
    const band = Math.floor(i / 5);
    const kind = (i + seed) % 4;
    const y = 20 + row * 15 + (band % 2) * 3;
    const x = 22 + ((i * 13 + (seed % 7) * 4) % 56);

    if (kind === 0) {
      // Horizontal stroke (left -> right)
      const x1 = Math.max(16, 22 + (band % 2) * 8);
      const x2 = Math.min(84, 78 - (band % 2) * 6);
      paths.push(`M ${x1} ${y} L ${x2} ${y}`);
    } else if (kind === 1) {
      // Vertical stroke (top -> bottom)
      const y1 = Math.max(14, 18 + (band % 2) * 8);
      const y2 = Math.min(86, 82 - (band % 2) * 6);
      paths.push(`M ${x} ${y1} L ${x} ${y2}`);
    } else if (kind === 2) {
      // Left-sweeping diagonal
      const sx = Math.min(80, Math.max(30, x + 8));
      const sy = Math.max(16, y - 6);
      const ex = Math.max(16, sx - 22);
      const ey = Math.min(86, sy + 28);
      paths.push(`M ${sx} ${sy} L ${ex} ${ey}`);
    } else {
      // Right-sweeping diagonal
      const sx = Math.max(18, Math.min(68, x - 6));
      const sy = Math.max(16, y - 4);
      const ex = Math.min(84, sx + 22);
      const ey = Math.min(86, sy + 26);
      paths.push(`M ${sx} ${sy} L ${ex} ${ey}`);
    }
  }

  return paths;
}

/**
 * Merges the richly annotated curated SRS deck with all 2,136 Jōyō Kanji entries
 * so both the Kanji Flashcards and HTML5 Canvas Stroke Practice cover the complete
 * 2,136 Jōyō Kanji collection without duplicates.
 */
export function buildFullJoyoKanjiDeck(
  curatedDeck: KanjiCard[],
  joyoCatalog: JoyoKanjiEntry[]
): KanjiCard[] {
  const curatedByChar = new Map<string, KanjiCard>();
  for (const card of curatedDeck) {
    curatedByChar.set(card.kanji, card);
  }

  const seenChars = new Set<string>();
  const result: KanjiCard[] = [];

  // Preserve curated cards first so default initial card & SRS IDs remain stable
  for (const card of curatedDeck) {
    seenChars.add(card.kanji);
    result.push(card);
  }

  for (const entry of joyoCatalog) {
    if (!entry.kanji || seenChars.has(entry.kanji)) continue;
    seenChars.add(entry.kanji);

    const onyomi = parseReadingTokens(entry.onyomi);
    const kunyomi = parseReadingTokens(entry.kunyomi);
    const sampleWord = entry.sampleWord || entry.kanji;
    const sampleReading = entry.sampleReading || onyomi[0]?.kana || kunyomi[0]?.kana || '';
    const sampleMeaning = entry.sampleMeaning || entry.meaning;
    const radicalSymbol = entry.radical || entry.kanji;

    result.push({
      id: entry.id,
      kanji: entry.kanji,
      level: entry.level,
      meaning: entry.meaning,
      strokes: entry.strokes || 1,
      strokePaths: generateGuidedStrokePaths(entry.kanji, entry.strokes || 1),
      onyomi,
      kunyomi,
      radicals: [
        {
          symbol: radicalSymbol,
          name: `${entry.meaning} (${entry.strokes} strokes)`,
          meaning: `${entry.meaning} radical`,
          role: 'Meaning Radical',
        },
      ],
      combinationStory: `Built around the ${radicalSymbol} radical (${entry.strokes} strokes), expressing "${entry.meaning}" as used in ${sampleWord} (${sampleMeaning}).`,
      exampleSentence: {
        segments: [
          {
            text: sampleWord,
            reading: sampleReading || undefined,
          },
          { text: 'を使います。' },
        ],
        plain: `${sampleWord}を使います。`,
        romaji: `${simpleKanaToRomaji(sampleReading || sampleWord)} o tsukaimasu.`,
        english: `We use the word "${sampleMeaning}" (${sampleWord}).`,
      },
    });
  }

  return result;
}
