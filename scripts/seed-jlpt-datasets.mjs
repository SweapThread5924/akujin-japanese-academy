#!/usr/bin/env node
/**
 * AkuJin JLPT N5–N1 & 2,136 Jōyō Kanji Data-Seeding & Verification Script
 *
 * Usage:
 *   node scripts/seed-jlpt-datasets.mjs --verify   # Validate existing public/data JSON datasets & write manifest
 *   node scripts/seed-jlpt-datasets.mjs --refresh  # Fetch open-source Kanji/Vocab datasets and rebuild public/data/*
 *
 * Open Data Sources (--refresh):
 *   - 2,136 Jōyō Kanji: davidluzgouveia/kanji-data (kanji-jouyou.json)
 *   - JLPT N5–N1 Vocabulary: jamsinclair/open-anki-jlpt-decks (n5.csv .. n1.csv)
 *   - Common Japanese Lexicon Supplement: scriptin/jmdict-simplified (jmdict-eng-common)
 */

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'public', 'data');
const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const TARGET_VOCAB_QUOTAS = {
  N5: 800,
  N4: 700,
  N3: 2250,
  N2: 2250,
  N1: 4000,
};

const EXPECTED_JOYO_KANJI_TOTAL = 2136;

// Hepburn romaji converter for Hiragana/Katakana readings
const DIGRAPHS = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo', みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo', ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo', びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
};

const MONOGRAPHS = {
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
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
};

function katakanaToHiragana(str) {
  return String(str || '').replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

export function kanaToRomaji(input) {
  const hira = katakanaToHiragana(input);
  let out = '';
  for (let i = 0; i < hira.length; i++) {
    const ch = hira[i];
    if (ch === 'っ' && i + 1 < hira.length) {
      const nextPair = DIGRAPHS[hira.slice(i + 1, i + 3)];
      const nextSingle = MONOGRAPHS[hira[i + 1]];
      const nextRom = nextPair || nextSingle || '';
      if (nextRom) {
        out += nextRom[0] === 'c' ? 't' : nextRom[0];
        continue;
      }
    }
    if (ch === 'ー' && out.length > 0) {
      out += out[out.length - 1];
      continue;
    }
    const pair = DIGRAPHS[hira.slice(i, i + 2)];
    if (pair) {
      out += pair;
      i++;
      continue;
    }
    out += MONOGRAPHS[ch] ?? ch;
  }
  return out;
}

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function mapJlptNumberToLevel(jlptNew, grade) {
  if (jlptNew === 5) return 'N5';
  if (jlptNew === 4) return 'N4';
  if (jlptNew === 3) return 'N3';
  if (jlptNew === 2) return 'N2';
  if (jlptNew === 1) return 'N1';
  if (grade === 1) return 'N5';
  if (grade === 2) return 'N4';
  if (grade === 3 || grade === 4) return 'N3';
  if (grade === 5 || grade === 6) return 'N2';
  return 'N1';
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function refreshDatasets() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Fetching 2,136 Jōyō Kanji dataset...');
  const rawKanji = await fetchJson(
    'https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji-jouyou.json'
  );

  // Preserve existing sample words if already present
  const existingKanjiPath = path.join(DATA_DIR, 'joyo-kanji-2136.json');
  const existingSampleByChar = new Map();
  if (fs.existsSync(existingKanjiPath)) {
    const prev = JSON.parse(fs.readFileSync(existingKanjiPath, 'utf8'));
    for (const item of prev) {
      existingSampleByChar.set(item.kanji, item);
    }
  }

  const kanjiEntries = Object.entries(rawKanji).map(([char, meta], idx) => {
    const prev = existingSampleByChar.get(char);
    const level = mapJlptNumberToLevel(meta.jlpt_new, meta.grade);
    const meanings = Array.isArray(meta.meanings) ? meta.meanings.slice(0, 3).join(', ') : 'Core Kanji';
    const onyomi = Array.isArray(meta.readings_on) && meta.readings_on.length > 0
      ? meta.readings_on.slice(0, 3).join('・')
      : '—';
    const kunyomi = Array.isArray(meta.readings_kun) && meta.readings_kun.length > 0
      ? meta.readings_kun.slice(0, 3).join('・')
      : '—';

    return {
      id: prev?.id || `joyo-${idx + 1}`,
      level,
      kanji: char,
      meaning: meanings,
      onyomi,
      kunyomi,
      strokes: Number(meta.strokes) || 1,
      grade: Number(meta.grade) || 8,
      freq: Number(meta.freq) || 2500,
      radical: prev?.radical || `Grade ${meta.grade || 8}`,
      sampleWord: prev?.sampleWord || char,
      sampleReading: prev?.sampleReading || (meta.readings_kun?.[0] || meta.readings_on?.[0] || char),
      sampleMeaning: prev?.sampleMeaning || meanings.split(',')[0].trim(),
    };
  });

  const levelRank = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };
  kanjiEntries.sort((a, b) => levelRank[a.level] - levelRank[b.level] || a.freq - b.freq);
  fs.writeFileSync(existingKanjiPath, JSON.stringify(kanjiEntries));
  console.log(`Wrote ${kanjiEntries.length} Jōyō Kanji to public/data/joyo-kanji-2136.json`);

  // Refresh JLPT vocabulary decks while preserving enriched examples and exact syllabus quotas
  const seenWords = new Set();
  for (const lvl of JLPT_LEVELS) {
    const filePath = path.join(DATA_DIR, `jlpt-vocab-${lvl.toLowerCase()}.json`);
    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : [];

    const merged = [];
    for (const item of existing) {
      const key = `${item.word}|${item.reading}`;
      if (!seenWords.has(key) && item.word && item.reading && item.english) {
        seenWords.add(key);
        merged.push({
          ...item,
          level: lvl,
          romaji: item.romaji || kanaToRomaji(item.reading),
        });
      }
    }

    if (merged.length < TARGET_VOCAB_QUOTAS[lvl]) {
      console.log(`Fetching supplemental ${lvl} deck from open-anki-jlpt-decks...`);
      const csv = await fetchText(
        `https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/${lvl.toLowerCase()}.csv`
      );
      const lines = csv.split(/\r?\n/).slice(1);
      for (const line of lines) {
        if (merged.length >= TARGET_VOCAB_QUOTAS[lvl]) break;
        if (!line.trim()) continue;
        const [expression, reading, meaning] = parseCsvLine(line);
        const word = expression || reading;
        const kana = reading || expression;
        if (!word || !kana || !meaning) continue;
        const key = `${word}|${kana}`;
        if (seenWords.has(key)) continue;
        seenWords.add(key);
        merged.push({
          id: `${lvl.toLowerCase()}-v-${merged.length + 1}`,
          level: lvl,
          word,
          reading: kana,
          romaji: kanaToRomaji(kana),
          english: meaning,
          pos: 'Expression',
          category: `JLPT ${lvl} Core`,
        });
      }
    }

    const trimmed = merged.slice(0, TARGET_VOCAB_QUOTAS[lvl]);
    fs.writeFileSync(filePath, JSON.stringify(trimmed));
    console.log(`Wrote ${trimmed.length} words to public/data/jlpt-vocab-${lvl.toLowerCase()}.json`);
  }
}

export function verifyDatasets() {
  const kanjiPath = path.join(DATA_DIR, 'joyo-kanji-2136.json');
  const grammarPath = path.join(DATA_DIR, 'jlpt-grammar-all.json');

  if (!fs.existsSync(kanjiPath)) {
    throw new Error('Missing public/data/joyo-kanji-2136.json');
  }
  const kanji = JSON.parse(fs.readFileSync(kanjiPath, 'utf8'));
  const kanjiSet = new Set();
  const kanjiByLevel = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };

  for (const k of kanji) {
    if (!k.kanji || !k.meaning || !k.strokes || !JLPT_LEVELS.includes(k.level)) {
      throw new Error(`Invalid Kanji record: ${JSON.stringify(k)}`);
    }
    if (kanjiSet.has(k.kanji)) {
      throw new Error(`Duplicate Jōyō Kanji detected: ${k.kanji}`);
    }
    kanjiSet.add(k.kanji);
    kanjiByLevel[k.level]++;
  }

  if (kanji.length !== EXPECTED_JOYO_KANJI_TOTAL) {
    throw new Error(`Expected ${EXPECTED_JOYO_KANJI_TOTAL} Jōyō Kanji, found ${kanji.length}`);
  }

  const vocabByLevel = {};
  const vocabSet = new Set();
  let vocabTotal = 0;

  for (const lvl of JLPT_LEVELS) {
    const vocabPath = path.join(DATA_DIR, `jlpt-vocab-${lvl.toLowerCase()}.json`);
    if (!fs.existsSync(vocabPath)) {
      throw new Error(`Missing ${vocabPath}`);
    }
    const rows = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    if (rows.length !== TARGET_VOCAB_QUOTAS[lvl]) {
      throw new Error(`Expected ${TARGET_VOCAB_QUOTAS[lvl]} words for ${lvl}, found ${rows.length}`);
    }
    for (const v of rows) {
      if (!v.word || !v.reading || !v.romaji || !v.english) {
        throw new Error(`Invalid ${lvl} vocab record: ${JSON.stringify(v)}`);
      }
      const key = `${v.word}|${v.reading}`;
      if (vocabSet.has(key)) {
        throw new Error(`Duplicate vocabulary word detected across JLPT decks: ${key}`);
      }
      vocabSet.add(key);
    }
    vocabByLevel[lvl] = rows.length;
    vocabTotal += rows.length;
  }

  const grammar = fs.existsSync(grammarPath)
    ? JSON.parse(fs.readFileSync(grammarPath, 'utf8'))
    : {};
  const grammarByLevel = {};
  let grammarTotal = 0;
  for (const lvl of JLPT_LEVELS) {
    const count = Array.isArray(grammar[lvl]) ? grammar[lvl].length : 0;
    grammarByLevel[lvl] = count;
    grammarTotal += count;
  }

  const manifest = {
    schemaVersion: 1,
    verifiedAt: new Date().toISOString(),
    kanji: {
      total: kanji.length,
      byLevel: kanjiByLevel,
    },
    vocabulary: {
      total: vocabTotal,
      byLevel: vocabByLevel,
    },
    grammar: {
      total: grammarTotal,
      byLevel: grammarByLevel,
    },
  };

  fs.writeFileSync(
    path.join(DATA_DIR, 'dataset-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return manifest;
}

const isCliEntry = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isCliEntry) {
  const mode = process.argv.includes('--refresh') ? 'refresh' : 'verify';
  (async () => {
    if (mode === 'refresh') {
      await refreshDatasets();
    }
    const manifest = verifyDatasets();
    console.log('AkuJin Dataset Verification Passed:');
    console.log(JSON.stringify(manifest, null, 2));
  })().catch((err) => {
    console.error('Dataset seeding/verification failed:', err);
    process.exit(1);
  });
}
