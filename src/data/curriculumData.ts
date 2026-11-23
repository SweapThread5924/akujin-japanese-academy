import type { JlptLevel, RegisterSample } from '../utils/srsEngine';

export interface FuriganaSegment {
  text: string;
  reading?: string;
}

export interface JlptTrackInfo {
  level: JlptLevel;
  japaneseName: string;
  title: string;
  targetHours: string;
  kanjiGoal: number;
  vocabGoal: number;
  summary: string;
  examTips: string[];
  skillPillars: {
    skill: 'Reading' | 'Listening' | 'Speaking' | 'Grammar' | 'Vocabulary';
    focus: string;
  }[];
}

export interface KanaChar {
  kana: string;
  romaji: string;
  group: string;
}

export interface FlashcardItem {
  id: string;
  level: JlptLevel;
  category: 'Vocabulary' | 'Grammar' | 'Listening' | 'Exam Strategy';
  segments: FuriganaSegment[];
  plainJapanese: string;
  reading: string;
  romaji: string;
  english: string;
  grammarTip: string;
  examNote: string;
}

export interface QuizQuestion {
  id: string;
  level: JlptLevel;
  skill: 'Grammar' | 'Vocabulary' | 'Reading' | 'Listening' | 'Exam Trap';
  prompt: string;
  segments: FuriganaSegment[];
  plainJapanese: string;
  romaji: string;
  options: {
    id: string;
    label: string;
    reading?: string;
  }[];
  correctOptionId: string;
  explanation: string;
}

export interface SpeechBubbleToken {
  id: string;
  surface: string;
  reading: string;
  romaji: string;
  tag: 'Slang' | 'Contraction' | 'Onomatopoeia' | 'Particle' | 'Core';
  meaning: string;
  nuanceNote: string;
}

export interface SpeechBubbleItem {
  id: string;
  speaker: string;
  scene: string;
  level: JlptLevel;
  plainJapanese: string;
  romaji: string;
  english: string;
  tokens: SpeechBubbleToken[];
}

export interface TextbookAnimeExample {
  id: string;
  situation: string;
  level: JlptLevel;
  tiers: [RegisterSample, RegisterSample, RegisterSample];
}

export interface RadicalNode {
  symbol: string;
  name: string;
  meaning: string;
  role: 'Meaning Radical' | 'Phonetic / Component';
}

export interface KanjiCard {
  id: string;
  kanji: string;
  level: JlptLevel;
  meaning: string;
  strokes: number;
  strokePaths: string[]; // SVG paths in 0 0 100 100 viewBox
  onyomi: { kana: string; romaji: string }[];
  kunyomi: { kana: string; romaji: string }[];
  radicals: RadicalNode[];
  combinationStory: string;
  exampleSentence: {
    segments: FuriganaSegment[];
    plain: string;
    romaji: string;
    english: string;
  };
}

export interface DialogueWordToken {
  id: string;
  surface: string;
  reading: string;
  romaji: string;
  partOfSpeech: string;
  kanjiBreakdown: string;
  meaning: string;
}

export interface ScenarioLine {
  id: string;
  speaker: string;
  role: 'Staff' | 'You' | 'Announcement';
  plainJapanese: string;
  romaji: string;
  english: string;
  tokens: DialogueWordToken[];
}

export interface ScenarioModule {
  id: string;
  title: string;
  japaneseTitle: string;
  category: 'Ordering at an Izakaya' | 'Navigating Tokyo Train Stations' | 'Convenience Store Etiquette' | 'Corporate Keigo & Tea Room';
  level: JlptLevel;
  unlockXp: number;
  imageUrl: string;
  summary: string;
  lines: ScenarioLine[];
  culturalNotes: {
    title: string;
    registerType: 'Polite (Teineigo)' | 'Honorific (Keigo)' | 'Casual / Local Custom';
    explanation: string;
  }[];
}

export interface LessonUnit {
  id: string;
  level: JlptLevel;
  code: string;
  title: string;
  subtitle: string;
  focusSkills: string[];
  examScoreTip: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  japaneseStamp: string;
  description: string;
  xpBonus: number;
}

export const JLPT_TRACKS: JlptTrackInfo[] = [
  {
    level: 'N5',
    japaneseName: '初級・N5',
    title: 'Foundations & Daily Survival',
    targetHours: '150 hrs',
    kanjiGoal: 100,
    vocabGoal: 800,
    summary: 'Master Hiragana, Katakana, core particles (は・が・を・に・で), polite ます/です forms, and everyday survival conversations.',
    examTips: [
      'Lock in 100 core Kanji radicals before memorizing compound words.',
      'Listen for sentence-final negatives (〜ません vs 〜ました) in JLPT listening Section 1.',
    ],
    skillPillars: [
      { skill: 'Reading', focus: 'Hiragana, Katakana, and 100 high-frequency Kanji notices.' },
      { skill: 'Listening', focus: 'Slow daily errands, numbers, times, and station announcements.' },
      { skill: 'Speaking', focus: 'Self-introductions, ordering food, and polite requests (〜てください).' },
      { skill: 'Grammar', focus: 'Core particles, i/na-adjectives, and te-form connectors.' },
      { skill: 'Vocabulary', focus: '800 essential nouns, verbs, and counters.' },
    ],
  },
  {
    level: 'N4',
    japaneseName: '基礎・N4',
    title: 'Everyday Conversations & Plain Form',
    targetHours: '300 hrs',
    kanjiGoal: 300,
    vocabGoal: 1500,
    summary: 'Bridge from textbook politeness into natural casual speech, conditionals (たら・ば・なら), potential verbs, and giving/receiving verbs.',
    examTips: [
      'Separate あげる・くれる・もらう directionality using speaker perspective arrows.',
      'Practice skimming short email passages in under 90 seconds per question.',
    ],
    skillPillars: [
      { skill: 'Reading', focus: 'Short emails, diary entries, and simple cultural essays.' },
      { skill: 'Listening', focus: 'Natural-speed conversations with casual contractions.' },
      { skill: 'Speaking', focus: 'Expressing intentions, permissions, and polite apologies.' },
      { skill: 'Grammar', focus: 'Plain form, passive/causative basics, and conditionals.' },
      { skill: 'Vocabulary', focus: '1,500 daily life words and common transitive/intransitive pairs.' },
    ],
  },
  {
    level: 'N3',
    japaneseName: '中級・N3',
    title: 'Natural Fluency & Anime/News Bridge',
    targetHours: '500 hrs',
    kanjiGoal: 650,
    vocabGoal: 3750,
    summary: 'Decode everyday Japanese media, newspapers, workplace honorifics (Keigo), and nuanced speaker attitudes (〜わけだ・〜はずだ).',
    examTips: [
      'Spot contrast markers (ところが・にもかかわらず) to predict paragraph conclusions.',
      'Use JLPT N3 reading star-questions (★) by pairing clause endings first.',
    ],
    skillPillars: [
      { skill: 'Reading', focus: 'Magazine articles, opinion columns, and workplace memos.' },
      { skill: 'Listening', focus: 'Multi-speaker discussions and implied refusals.' },
      { skill: 'Speaking', focus: 'Switching smoothly between casual slang and office Keigo.' },
      { skill: 'Grammar', focus: 'Modality, passive-causative, and formal written conjunctions.' },
      { skill: 'Vocabulary', focus: '3,750 words including mimetic onomatopoeia (擬態語).' },
    ],
  },
  {
    level: 'N2',
    japaneseName: '上級・N2',
    title: 'Professional & Academic Fluency',
    targetHours: '800 hrs',
    kanjiGoal: 1000,
    vocabGoal: 6000,
    summary: 'Achieve career-ready Japanese for interviews, business negotiations, technical manuals, and rapid editorial comprehension.',
    examTips: [
      'Eliminate double-negative traps in N2 reading comprehension.',
      'Memorize 4-kanji idioms (四字熟語) and formal business Keigo pairings.',
    ],
    skillPillars: [
      { skill: 'Reading', focus: 'Newspaper editorials, critiques, and corporate reports.' },
      { skill: 'Listening', focus: 'Unscripted radio interviews and nuanced business calls.' },
      { skill: 'Speaking', focus: 'Persuasive presentations and respectful disagreement.' },
      { skill: 'Grammar', focus: 'Written literary patterns (〜ざるを得ない・〜に伴って).' },
      { skill: 'Vocabulary', focus: '6,000 abstract, economic, and societal terms.' },
    ],
  },
  {
    level: 'N1',
    japaneseName: '達人・N1',
    title: 'Near-Native Mastery & Literature',
    targetHours: '1,200+ hrs',
    kanjiGoal: 2136,
    vocabGoal: 10000,
    summary: 'Command full Joyo Kanji, classical undertones, philosophical essays, and subtle rhetorical nuance at native speed.',
    examTips: [
      'Read author tone first in N1 comparative passages before checking details.',
      'Track subtle auxiliary shifts (〜ともなると・〜極まりない) in reading Section 3.',
    ],
    skillPillars: [
      { skill: 'Reading', focus: 'Literary critiques, legal summaries, and dense essays.' },
      { skill: 'Listening', focus: 'Rapid lectures, irony, and implicit social cues.' },
      { skill: 'Speaking', focus: 'Diplomatic negotiation, humor, and idiomatic rhetoric.' },
      { skill: 'Grammar', focus: 'Classical residuals (〜べからず・〜んがため) and high rhetoric.' },
      { skill: 'Vocabulary', focus: '10,000+ nuanced expressions and kanji compounds.' },
    ],
  },
];

export const HIRAGANA_SAMPLE: KanaChar[] = [
  { kana: 'あ', romaji: 'a', group: 'Vowels' },
  { kana: 'い', romaji: 'i', group: 'Vowels' },
  { kana: 'う', romaji: 'u', group: 'Vowels' },
  { kana: 'え', romaji: 'e', group: 'Vowels' },
  { kana: 'お', romaji: 'o', group: 'Vowels' },
  { kana: 'か', romaji: 'ka', group: 'K' },
  { kana: 'き', romaji: 'ki', group: 'K' },
  { kana: 'く', romaji: 'ku', group: 'K' },
  { kana: 'け', romaji: 'ke', group: 'K' },
  { kana: 'こ', romaji: 'ko', group: 'K' },
  { kana: 'さ', romaji: 'sa', group: 'S' },
  { kana: 'し', romaji: 'shi', group: 'S' },
  { kana: 'す', romaji: 'su', group: 'S' },
  { kana: 'せ', romaji: 'se', group: 'S' },
  { kana: 'そ', romaji: 'so', group: 'S' },
];

export const KATAKANA_SAMPLE: KanaChar[] = [
  { kana: 'ア', romaji: 'a', group: 'Vowels' },
  { kana: 'イ', romaji: 'i', group: 'Vowels' },
  { kana: 'ウ', romaji: 'u', group: 'Vowels' },
  { kana: 'エ', romaji: 'e', group: 'Vowels' },
  { kana: 'オ', romaji: 'o', group: 'Vowels' },
  { kana: 'カ', romaji: 'ka', group: 'K' },
  { kana: 'キ', romaji: 'ki', group: 'K' },
  { kana: 'ク', romaji: 'ku', group: 'K' },
  { kana: 'ケ', romaji: 'ke', group: 'K' },
  { kana: 'コ', romaji: 'ko', group: 'K' },
  { kana: 'サ', romaji: 'sa', group: 'S' },
  { kana: 'シ', romaji: 'shi', group: 'S' },
  { kana: 'ス', romaji: 'su', group: 'S' },
  { kana: 'セ', romaji: 'se', group: 'S' },
  { kana: 'ソ', romaji: 'so', group: 'S' },
];

export const LESSONS: LessonUnit[] = [
  {
    id: 'lesson-n5-particles',
    level: 'N5',
    code: 'N5 · Unit 01',
    title: 'Core Particles & Polite Requests',
    subtitle: 'Master は, が, を, に, で and natural polite requests without sounding robotic.',
    focusSkills: ['Grammar', 'Speaking', 'Listening'],
    examScoreTip: 'On JLPT N5, で marks the action location while に marks destination or static existence.',
  },
  {
    id: 'lesson-n4-contractions',
    level: 'N4',
    code: 'N4 · Unit 04',
    title: 'Casual Contractions & Giving/Receiving',
    subtitle: 'Understand 〜ちゃう, 〜てる, and how Tokyo locals compress everyday speech.',
    focusSkills: ['Listening', 'Speaking', 'Anime vs Textbook'],
    examScoreTip: 'Always verify who benefits from 〜てくれる (for me/us) vs 〜てあげる (for others).',
  },
  {
    id: 'lesson-n3-nuance',
    level: 'N3',
    code: 'N3 · Unit 08',
    title: 'Onomatopoeia & Speaker Nuance',
    subtitle: 'Express subtle emotions with ドキドキ, ワクワク, and reasoning markers like わけだ.',
    focusSkills: ['Reading', 'Vocabulary', 'Nuance'],
    examScoreTip: 'JLPT N3 loves testing the difference between はず (logical expectation) and わけ (natural conclusion).',
  },
  {
    id: 'lesson-n2-keigo',
    level: 'N2',
    code: 'N2 · Unit 12',
    title: 'Business Keigo & Reading Speed',
    subtitle: 'Distinguish Sonkeigo (elevating the listener) from Kenjougo (humbling yourself) under exam pressure.',
    focusSkills: ['Reading', 'Exam Strategy', 'Keigo'],
    examScoreTip: 'Never attach お〜になる to your own actions; use お〜する or special humble verbs like 伺う.',
  },
  {
    id: 'lesson-n1-rhetoric',
    level: 'N1',
    code: 'N1 · Unit 16',
    title: 'Editorial Rhetoric & Classical Residuals',
    subtitle: 'Decode dense essays using 〜ざるを得ない, 〜極まりない, and author-tone tracking.',
    focusSkills: ['Reading', 'Vocabulary', 'Exam Strategy'],
    examScoreTip: 'In N1 long passages, read the final paragraph claim first to anchor every rhetorical contrast.',
  },
];

export const FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    level: 'N5',
    category: 'Vocabulary',
    segments: [
      { text: '駅', reading: 'えき' },
      { text: 'で' },
      { text: '切符', reading: 'きっぷ' },
      { text: 'を' },
      { text: '買', reading: 'か' },
      { text: 'います。' },
    ],
    plainJapanese: '駅で切符を買います。',
    reading: 'えき で きっぷ を かいます。',
    romaji: 'Eki de kippu o kaimasu.',
    english: 'I buy a train ticket at the station.',
    grammarTip: 'で marks the location where the action of buying takes place.',
    examNote: 'JLPT N5 frequently tests 切符 (きっぷ) with the double consonant っ.',
  },
  {
    id: 'fc-2',
    level: 'N5',
    category: 'Grammar',
    segments: [
      { text: '明日', reading: 'あした' },
      { text: 'の' },
      { text: '朝', reading: 'あさ' },
      { text: '、' },
      { text: '早', reading: 'はや' },
      { text: 'く' },
      { text: '起', reading: 'お' },
      { text: 'きなければなりません。' },
    ],
    plainJapanese: '明日の朝、早く起きなければなりません。',
    reading: 'あした の あさ、 はやく おきなければなりません。',
    romaji: 'Ashita no asa, hayaku okinakereba narimasen.',
    english: 'I have to wake up early tomorrow morning.',
    grammarTip: 'Negative stem + なければなりません expresses obligation ("must").',
    examNote: 'In spoken casual Japanese, this shortens to 起きなきゃ.',
  },
  {
    id: 'fc-3',
    level: 'N4',
    category: 'Vocabulary',
    segments: [
      { text: '約束', reading: 'やくそく' },
      { text: 'の' },
      { text: '時間', reading: 'じかん' },
      { text: 'に' },
      { text: '間', reading: 'ま' },
      { text: 'に' },
      { text: '合', reading: 'あ' },
      { text: 'いました。' },
    ],
    plainJapanese: '約束の時間に間に合いました。',
    reading: 'やくそく の じかん に まにあいました。',
    romaji: 'Yakusoku no jikan ni maniaimashita.',
    english: 'I made it in time for the appointment.',
    grammarTip: '間に合う (まにあう) always pairs with particle に for the deadline.',
    examNote: 'Distinguish 間に合う (in time) from 遅刻する (ちこくする, to be late).',
  },
  {
    id: 'fc-4',
    level: 'N3',
    category: 'Grammar',
    segments: [
      { text: '毎日', reading: 'まいにち' },
      { text: '練習', reading: 'れんしゅう' },
      { text: 'したんだから、' },
      { text: '合格', reading: 'ごうかく' },
      { text: 'するはずだ。' },
    ],
    plainJapanese: '毎日練習したんだから、合格するはずだ。',
    reading: 'まいにち れんしゅう したんだから、 ごうかく する はずだ。',
    romaji: 'Mainichi renshuu shita n dakara, goukaku suru hazu da.',
    english: 'Since I practiced every day, I ought to pass.',
    grammarTip: 'はずだ indicates strong expectation backed by clear evidence.',
    examNote: 'JLPT N3 pairs はず with から / のだから reasoning clauses.',
  },
  {
    id: 'fc-5',
    level: 'N2',
    category: 'Exam Strategy',
    segments: [
      { text: '部長', reading: 'ぶちょう' },
      { text: 'は' },
      { text: '先程', reading: 'さきほど' },
      { text: 'お' },
      { text: '戻', reading: 'もど' },
      { text: 'りになりました。' },
    ],
    plainJapanese: '部長は先程お戻りになりました。',
    reading: 'ぶちょう は さきほど おもどり になりました。',
    romaji: 'Buchou wa sakihodo o-modori ni narimashita.',
    english: 'The department manager returned just a moment ago.',
    grammarTip: 'お + verb stem + になる is respectful Sonkeigo elevating the manager.',
    examNote: 'Never use this form for your own actions; use 戻りました or 参りました.',
  },
  {
    id: 'fc-6',
    level: 'N1',
    category: 'Grammar',
    segments: [
      { text: '状況', reading: 'じょうきょう' },
      { text: 'が' },
      { text: '悪化', reading: 'あっか' },
      { text: 'したため、' },
      { text: '計画', reading: 'けいかく' },
      { text: 'を' },
      { text: '変更', reading: 'へんこう' },
      { text: 'せざるを' },
      { text: '得', reading: 'え' },
      { text: 'ない。' },
    ],
    plainJapanese: '状況が悪化したため、計画を変更せざるを得ない。',
    reading: 'じょうきょう が あっか したため、 けいかく を へんこう せざるをえない。',
    romaji: 'Joukyou ga akka shita tame, keikaku o henkou sezaru o enai.',
    english: 'Because the situation worsened, we have no choice but to revise the plan.',
    grammarTip: '〜ざるを得ない attaches to negative ない-stem (with する becoming せざるを得ない).',
    examNote: 'High-yield JLPT N1 formal grammar pattern.',
  },
];

export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: 'q-n5-1',
    level: 'N5',
    skill: 'Grammar',
    prompt: 'Choose the particle that marks the location where you eat ramen:',
    segments: [
      { text: '新宿', reading: 'しんじゅく' },
      { text: '（　）ラーメンを' },
      { text: '食', reading: 'た' },
      { text: 'べます。' },
    ],
    plainJapanese: '新宿（　）ラーメンを食べます。',
    romaji: 'Shinjuku ( ) raamen o tabemasu.',
    options: [
      { id: 'a', label: 'で', reading: 'de (action location)' },
      { id: 'b', label: 'を', reading: 'o (direct object)' },
      { id: 'c', label: 'へ', reading: 'e (direction)' },
      { id: 'd', label: 'と', reading: 'to (with/and)' },
    ],
    correctOptionId: 'a',
    explanation: 'Use で to mark the place where an action (eating, studying, buying) occurs.',
  },
  {
    id: 'q-n5-2',
    level: 'N5',
    skill: 'Vocabulary',
    prompt: 'What is the accurate reading of 図書館?',
    segments: [{ text: '図書館', reading: '？？？' }],
    plainJapanese: '図書館',
    romaji: 'Library',
    options: [
      { id: 'a', label: 'としょかん', reading: 'toshokan' },
      { id: 'b', label: 'としょうかん', reading: 'toshoukan' },
      { id: 'c', label: 'ずしょかん', reading: 'zushokan' },
      { id: 'd', label: 'としょがく', reading: 'toshogaku' },
    ],
    correctOptionId: 'a',
    explanation: '図書館 is read としょかん (short しょ). JLPT N5 tests long vs short vowels heavily!',
  },
  {
    id: 'q-n4-1',
    level: 'N4',
    skill: 'Grammar',
    prompt: 'Pick the natural contraction for 「食べてしまった」 ("I accidentally ate it all"):',
    segments: [
      { text: 'ケーキを全部', reading: 'ぜんぶ' },
      { text: '（　）。' },
    ],
    plainJapanese: 'ケーキを全部（　）。',
    romaji: 'Keeki o zenbu ( ).',
    options: [
      { id: 'a', label: '食べちゃった', reading: 'tabechatta' },
      { id: 'b', label: '食べてる', reading: 'tabeteru' },
      { id: 'c', label: '食べとく', reading: 'tabetoku' },
      { id: 'd', label: '食べなきゃ', reading: 'tabenakya' },
    ],
    correctOptionId: 'a',
    explanation: '〜てしまう contracts to 〜ちゃう in casual Tokyo speech (and 〜てしまった → 〜ちゃった).',
  },
  {
    id: 'q-n3-1',
    level: 'N3',
    skill: 'Vocabulary',
    prompt: 'Which onomatopoeia describes your heart pounding with excitement or nervousness?',
    segments: [
      { text: '面接', reading: 'めんせつ' },
      { text: 'の' },
      { text: '前', reading: 'まえ' },
      { text: 'で' },
      { text: '胸', reading: 'むね' },
      { text: 'が（　）する。' },
    ],
    plainJapanese: '面接の前で胸が（　）する。',
    romaji: 'Mensetsu no mae de mune ga ( ) suru.',
    options: [
      { id: 'a', label: 'ドキドキ', reading: 'dokidoki (heart pounding)' },
      { id: 'b', label: 'ペコペコ', reading: 'pekopeko (starving)' },
      { id: 'c', label: 'シーン', reading: 'shiin (dead silent)' },
      { id: 'd', label: 'ピカピカ', reading: 'pikapika (sparkling clean)' },
    ],
    correctOptionId: 'a',
    explanation: 'ドキドキ captures a fast heartbeat before an interview, confession, or big moment.',
  },
  {
    id: 'q-n2-1',
    level: 'N2',
    skill: 'Exam Trap',
    prompt: 'How do you politely tell a client "I will check and contact you"?',
    segments: [
      { text: '確認', reading: 'かくにん' },
      { text: 'の上、' },
      { text: 'ご連絡', reading: 'れんらく' },
      { text: '（　）。' },
    ],
    plainJapanese: '確認の上、ご連絡（　）。',
    romaji: 'Kakunin no ue, go-renraku ( ).',
    options: [
      { id: 'a', label: 'いたします', reading: 'itashimasu (humble Kenjougo)' },
      { id: 'b', label: 'になります', reading: 'ni narimasu (honorific Sonkeigo)' },
      { id: 'c', label: 'くださいます', reading: 'kudasaimasu (listener acts)' },
      { id: 'd', label: 'おっしゃいます', reading: 'osshaimasu (listener speaks)' },
    ],
    correctOptionId: 'a',
    explanation: 'Since YOU are contacting the client, humble your own action with ご + noun + いたします.',
  },
  {
    id: 'q-n1-1',
    level: 'N1',
    skill: 'Reading',
    prompt: 'Complete the formal N1 sentence meaning "Without effort, success is impossible":',
    segments: [
      { text: '努力', reading: 'どりょく' },
      { text: '（　）、' },
      { text: '成功', reading: 'せいこう' },
      { text: 'は' },
      { text: 'あり' },
      { text: '得', reading: 'え' },
      { text: 'ない。' },
    ],
    plainJapanese: '努力（　）、成功はあり得ない。',
    romaji: 'Doryoku ( ), seikou wa arienai.',
    options: [
      { id: 'a', label: 'なくして', reading: 'nakushite (without)' },
      { id: 'b', label: 'に際して', reading: 'ni saishite (on the occasion of)' },
      { id: 'c', label: 'ともあれ', reading: 'tomoare (putting aside)' },
      { id: 'd', label: 'きわまりない', reading: 'kiwamarinai (extremely)' },
    ],
    correctOptionId: 'a',
    explanation: 'Noun + なくして is a high-register N1 written expression meaning "without X, Y cannot happen".',
  },
];

export const SPEECH_BUBBLES: SpeechBubbleItem[] = [
  {
    id: 'sb-1',
    speaker: 'Haruka · Tokyo Student',
    scene: 'Casual hallway chat before an exam',
    level: 'N4',
    plainJapanese: 'うわっ、マジでヤバい！今日テストだって忘れてた…心臓ドキドキ！',
    romaji: 'Uwa, maji de yabai! Kyou tesuto datte wasureteta… shinzou dokidoki!',
    english: 'Whoa, seriously no way! I totally forgot the test is today… my heart is pounding!',
    tokens: [
      {
        id: 't1',
        surface: 'うわっ',
        reading: 'うわっ',
        romaji: 'uwa!',
        tag: 'Onomatopoeia',
        meaning: 'Whoa! / Yikes!',
        nuanceNote: 'Sudden vocal gasp of surprise or panic; common in spoken Japanese & manga.',
      },
      {
        id: 't2',
        surface: 'マジで',
        reading: 'まじで',
        romaji: 'maji de',
        tag: 'Slang',
        meaning: 'Seriously / For real',
        nuanceNote: 'Derived from 真面目 (majime). Ubiquitous casual intensifier among friends.',
      },
      {
        id: 't3',
        surface: 'ヤバい',
        reading: 'やばい',
        romaji: 'yabai',
        tag: 'Slang',
        meaning: 'Oh no / Crazy / Amazing (context-dependent)',
        nuanceNote: 'Here it means "uh oh, I am in trouble", though it also means "awesome" in positive contexts.',
      },
      {
        id: 't4',
        surface: '忘れてた',
        reading: 'わすれてた',
        romaji: 'wasureteta',
        tag: 'Contraction',
        meaning: 'Had forgotten',
        nuanceNote: 'Drops the い from 忘れていた → 忘れてた for faster natural rhythm.',
      },
      {
        id: 't5',
        surface: 'ドキドキ',
        reading: 'どきどき',
        romaji: 'dokidoki',
        tag: 'Onomatopoeia',
        meaning: 'Heart pounding fast',
        nuanceNote: 'Mimetic sound effect (擬音語) expressing nervous or excited heartbeat.',
      },
    ],
  },
  {
    id: 'sb-2',
    speaker: 'Ren · Anime Club',
    scene: 'After skipping lunch during club prep',
    level: 'N3',
    plainJapanese: '腹ペコペコだわ〜。コンビニ寄ってなんか買ってこようぜ！',
    romaji: 'Hara pekopeko da wa~. Konbini yotte nanka katte koyou ze!',
    english: 'I am starving! Let’s stop by the convenience store and grab something!',
    tokens: [
      {
        id: 't6',
        surface: '腹ペコペコ',
        reading: 'はらぺこぺこ',
        romaji: 'hara pekopeko',
        tag: 'Onomatopoeia',
        meaning: 'Stomach totally empty / starving',
        nuanceNote: 'ペコペコ evokes a hollowed stomach; often shortened to 腹ペコ (hara-peko).',
      },
      {
        id: 't7',
        surface: 'だわ〜',
        reading: 'だわ',
        romaji: 'da wa~',
        tag: 'Particle',
        meaning: 'Emphatic realization ("man, it really is...")',
        nuanceNote: 'Falling-tone だわ expresses mild exclamation across Kansai and young Tokyo speakers.',
      },
      {
        id: 't8',
        surface: 'なんか',
        reading: 'なんか',
        romaji: 'nanka',
        tag: 'Contraction',
        meaning: 'Something (casual)',
        nuanceNote: 'Spoken contraction of 何か (nanika). Very common when suggesting snacks.',
      },
      {
        id: 't9',
        surface: '買ってこようぜ',
        reading: 'かってこようぜ',
        romaji: 'katte koyou ze',
        tag: 'Slang',
        meaning: 'Let’s go buy and come back!',
        nuanceNote: '〜てくる implies going and returning; ぜ adds energetic camaraderie.',
      },
    ],
  },
];

export const TEXTBOOK_VS_ANIME: TextbookAnimeExample[] = [
  {
    id: 'tva-1',
    situation: 'Asking someone what they are doing',
    level: 'N5',
    tiers: [
      {
        registerLabel: 'Textbook Polite',
        japaneseTag: '教科書・丁寧語',
        japanese: '今、何をしていますか。',
        reading: 'いま、 なに を しています か。',
        romaji: 'Ima, nani o shite imasu ka.',
        english: 'What are you doing right now?',
        grammarNote: 'Full progressive 〜ています with explicit を particle and polite か question marker.',
      },
      {
        registerLabel: 'Natural Tokyo Casual',
        japaneseTag: '日常・タメ口',
        japanese: '今、何してるの？',
        reading: 'いま、 なに してる の？',
        romaji: 'Ima, nani shiteru no?',
        english: 'What are you up to right now?',
        grammarNote: 'Drops を and compresses している → してる, softening the question with の.',
      },
      {
        registerLabel: 'Anime / Expressive',
        japaneseTag: 'アニメ・砕けた表現',
        japanese: 'おい、何やってんだよ！？',
        reading: 'おい、 なに やってんだ よ！？',
        romaji: 'Oi, nani yatten da yo!?',
        english: 'Hey, what on earth are you doing?!',
        grammarNote: 'Uses やる instead of する, contracts ている の だ → てんだ, and adds confrontational よ.',
      },
    ],
  },
  {
    id: 'tva-2',
    situation: 'Saying you have to go right now',
    level: 'N4',
    tiers: [
      {
        registerLabel: 'Textbook Polite',
        japaneseTag: '教科書・丁寧語',
        japanese: 'すみませんが、もう行かなければなりません。',
        reading: 'すみませんが、 もう いかなければなりません。',
        romaji: 'Sumimasen ga, mou ikanakereba narimasen.',
        english: 'Excuse me, but I must leave now.',
        grammarNote: 'Full textbook obligation pattern 〜なければなりません.',
      },
      {
        registerLabel: 'Natural Tokyo Casual',
        japaneseTag: '日常・タメ口',
        japanese: 'ごめん、もう行かなきゃ！',
        reading: 'ごめん、 もう いかなきゃ！',
        romaji: 'Gomen, mou ikanakya!',
        english: 'Sorry, I gotta head out now!',
        grammarNote: 'Compresses なければなりません all the way down to 〜なきゃ.',
      },
      {
        registerLabel: 'Anime / Expressive',
        japaneseTag: 'アニメ・砕けた表現',
        japanese: 'わりぃ、もう行かねえとヤバいんだ！',
        reading: 'わりぃ、 もう いかねえ と やばいんだ！',
        romaji: 'Warii, mou ikanee to yabai n da!',
        english: 'My bad, I’m toast if I don’t bounce right now!',
        grammarNote: 'Slurs 悪い → わりぃ and 行かない → 行かねえ (classic energetic shonen speech).',
      },
    ],
  },
  {
    id: 'tva-3',
    situation: 'Expressing deep gratitude',
    level: 'N3',
    tiers: [
      {
        registerLabel: 'Textbook Polite',
        japaneseTag: '教科書・丁寧語',
        japanese: '本当にありがとうございました。助かりました。',
        reading: 'ほんとうに ありがとうございました。 たすかりました。',
        romaji: 'Hontou ni arigatou gozaimashita. Tasukarimashita.',
        english: 'Thank you very much. You really saved me.',
        grammarNote: 'Standard respectful gratitude for a completed favor.',
      },
      {
        registerLabel: 'Natural Tokyo Casual',
        japaneseTag: '日常・タメ口',
        japanese: 'ほんとありがとう！めっちゃ助かった！',
        reading: 'ほんと ありがとう！ めっちゃ たすかった！',
        romaji: 'Honto arigatou! Meccha tasukatta!',
        english: 'Thanks so much! That was a huge help!',
        grammarNote: 'Replaces 本当に with ほんと and adds めっちゃ ("super/seriously").',
      },
      {
        registerLabel: 'Anime / Expressive',
        japaneseTag: 'アニメ・砕けた表現',
        japanese: 'サンキューな！マジで助かったぜ！',
        reading: 'さんきゅーな！ まじで たすかったぜ！',
        romaji: 'Sankyuu na! Maji de tasukatta ze!',
        english: 'Thanks, buddy! You seriously saved my skin!',
        grammarNote: 'Playful katakana loanword サンキュー + warm camaraderie particle な / ぜ.',
      },
    ],
  },
];

export const KANJI_DECK: KanjiCard[] = [
  {
    id: 'kanji-yasumu',
    kanji: '休',
    level: 'N5',
    meaning: 'Rest · Holiday',
    strokes: 6,
    strokePaths: [
      'M 34 16 C 28 32 20 44 12 54',
      'M 26 36 L 26 86',
      'M 40 38 L 86 38',
      'M 63 14 L 63 86',
      'M 63 38 C 54 54 44 68 34 76',
      'M 63 38 C 72 54 82 68 90 76',
    ],
    onyomi: [{ kana: 'キュウ', romaji: 'kyuu' }],
    kunyomi: [
      { kana: 'やす(む)', romaji: 'yasu(mu)' },
      { kana: 'やす(み)', romaji: 'yasu(mi)' },
    ],
    radicals: [
      { symbol: '亻', name: 'Ninben', meaning: 'Person', role: 'Meaning Radical' },
      { symbol: '木', name: 'Ki', meaning: 'Tree', role: 'Phonetic / Component' },
    ],
    combinationStory: 'A person (亻) leaning against a shade tree (木) to take a well-earned rest.',
    exampleSentence: {
      segments: [
        { text: '日曜日', reading: 'にちようび' },
        { text: 'は' },
        { text: '学校', reading: 'がっこう' },
        { text: 'が' },
        { text: '休', reading: 'やす' },
        { text: 'みです。' },
      ],
      plain: '日曜日は学校が休みです。',
      romaji: 'Nichiyoubi wa gakkou ga yasumi desu.',
      english: 'School is closed on Sundays.',
    },
  },
  {
    id: 'kanji-miru',
    kanji: '見',
    level: 'N5',
    meaning: 'See · Look · Show',
    strokes: 7,
    strokePaths: [
      'M 30 18 L 30 62',
      'M 30 18 L 70 18 L 70 62',
      'M 30 33 L 70 33',
      'M 30 47 L 70 47',
      'M 30 62 L 70 62',
      'M 42 62 C 40 76 30 85 16 90',
      'M 58 62 L 58 80 C 58 88 64 88 86 88 L 86 78',
    ],
    onyomi: [{ kana: 'ケン', romaji: 'ken' }],
    kunyomi: [
      { kana: 'み(る)', romaji: 'mi(ru)' },
      { kana: 'み(える)', romaji: 'mi(eru)' },
    ],
    radicals: [
      { symbol: '目', name: 'Me', meaning: 'Eye', role: 'Meaning Radical' },
      { symbol: '儿', name: 'Hitoashi', meaning: 'Human legs', role: 'Phonetic / Component' },
    ],
    combinationStory: 'A wide eye (目) standing upright on legs (儿), actively looking out at the world.',
    exampleSentence: {
      segments: [
        { text: '富士', reading: 'ふじ' },
        { text: '山', reading: 'さん' },
        { text: 'を' },
        { text: '見', reading: 'み' },
        { text: 'ましたか。' },
      ],
      plain: '富士山を見ましたか。',
      romaji: 'Fujisan o mimashita ka.',
      english: 'Did you see Mount Fuji?',
    },
  },
  {
    id: 'kanji-eki',
    kanji: '駅',
    level: 'N4',
    meaning: 'Train Station',
    strokes: 14,
    strokePaths: [
      'M 16 20 L 42 20',
      'M 16 20 L 16 58',
      'M 29 20 L 29 58',
      'M 16 33 L 40 33',
      'M 16 45 L 40 45',
      'M 16 58 L 44 58 C 44 76 41 84 34 86',
      'M 12 72 L 10 82',
      'M 20 71 L 21 80',
      'M 28 70 L 30 78',
      'M 36 68 L 38 75',
      'M 54 22 L 84 22 L 82 48 L 54 48',
      'M 54 22 L 54 62 C 54 74 50 82 44 88',
      'M 68 48 C 74 64 82 78 90 86',
    ],
    onyomi: [{ kana: 'エキ', romaji: 'eki' }],
    kunyomi: [],
    radicals: [
      { symbol: '馬', name: 'Uma', meaning: 'Horse', role: 'Meaning Radical' },
      { symbol: '尺', name: 'Shaku', meaning: 'Measure / Relay post', role: 'Phonetic / Component' },
    ],
    combinationStory: 'Historically a relay post where courier horses (馬) were measured and swapped—now every modern train station.',
    exampleSentence: {
      segments: [
        { text: '渋谷', reading: 'しぶや' },
        { text: '駅', reading: 'えき' },
        { text: 'で' },
        { text: '乗', reading: 'の' },
        { text: 'り' },
        { text: '換', reading: 'か' },
        { text: 'えます。' },
      ],
      plain: '渋谷駅で乗り換えます。',
      romaji: 'Shibuya-eki de norikaemasu.',
      english: 'I will transfer trains at Shibuya Station.',
    },
  },
  {
    id: 'kanji-akarui',
    kanji: '明',
    level: 'N4',
    meaning: 'Bright · Clear · Next',
    strokes: 8,
    strokePaths: [
      'M 18 24 L 18 72',
      'M 18 24 L 42 24 L 42 72',
      'M 18 48 L 42 48',
      'M 18 72 L 42 72',
      'M 54 18 L 54 84',
      'M 54 18 L 82 18 L 82 84',
      'M 54 40 L 82 40',
      'M 54 60 L 82 60',
    ],
    onyomi: [
      { kana: 'メイ', romaji: 'mei' },
      { kana: 'ミョウ', romaji: 'myou' },
    ],
    kunyomi: [
      { kana: 'あか(るい)', romaji: 'aka(rui)' },
      { kana: 'あ(ける)', romaji: 'a(keru)' },
    ],
    radicals: [
      { symbol: '日', name: 'Hi', meaning: 'Sun', role: 'Meaning Radical' },
      { symbol: '月', name: 'Tsuki', meaning: 'Moon', role: 'Meaning Radical' },
    ],
    combinationStory: 'The Sun (日) and the Moon (月) shining side by side—creating complete brightness.',
    exampleSentence: {
      segments: [
        { text: '教室', reading: 'きょうしつ' },
        { text: 'が' },
        { text: 'とても' },
        { text: '明', reading: 'あか' },
        { text: 'るいです。' },
      ],
      plain: '教室がとても明るいです。',
      romaji: 'Kyoushitsu ga totemo akarui desu.',
      english: 'The classroom is very bright.',
    },
  },
  {
    id: 'kanji-kataru',
    kanji: '語',
    level: 'N3',
    meaning: 'Language · Word · Narrate',
    strokes: 14,
    strokePaths: [
      'M 24 16 L 32 24',
      'M 14 32 L 42 32',
      'M 18 44 L 38 44',
      'M 18 56 L 38 56',
      'M 18 68 L 38 68 L 38 84 L 18 84 Z',
      'M 52 22 L 84 22',
      'M 66 22 L 60 54',
      'M 52 38 L 80 38 L 78 54',
      'M 46 54 L 88 54',
      'M 54 66 L 82 66 L 82 86 L 54 86 Z',
    ],
    onyomi: [{ kana: 'ゴ', romaji: 'go' }],
    kunyomi: [{ kana: 'かた(る)', romaji: 'kata(ru)' }],
    radicals: [
      { symbol: '言', name: 'Gonben', meaning: 'Words / Speech', role: 'Meaning Radical' },
      { symbol: '吾', name: 'Go', meaning: 'Self / Five + Mouth', role: 'Phonetic / Component' },
    ],
    combinationStory: 'Spoken words (言) voiced from oneself (吾)—forming structured language.',
    exampleSentence: {
      segments: [
        { text: '日本語', reading: 'にほんご' },
        { text: 'で' },
        { text: '夢', reading: 'ゆめ' },
        { text: 'を' },
        { text: '語', reading: 'かた' },
        { text: 'る。' },
      ],
      plain: '日本語で夢を語る。',
      romaji: 'Nihongo de yume o kataru.',
      english: 'To speak about dreams in Japanese.',
    },
  },
  {
    id: 'kanji-kibou',
    kanji: '望',
    level: 'N3',
    meaning: 'Hope · Wish · Gaze Far',
    strokes: 11,
    strokePaths: [
      'M 28 14 L 28 24',
      'M 14 26 L 44 26',
      'M 20 26 L 20 46 L 42 46',
      'M 56 18 L 56 54',
      'M 56 18 L 82 18 L 82 54',
      'M 56 32 L 82 32',
      'M 56 44 L 82 44',
      'M 24 60 L 76 60',
      'M 50 60 L 50 86',
      'M 28 73 L 72 73',
      'M 16 86 L 84 86',
    ],
    onyomi: [
      { kana: 'ボウ', romaji: 'bou' },
      { kana: 'モウ', romaji: 'mou' },
    ],
    kunyomi: [{ kana: 'のぞ(む)', romaji: 'nozo(mu)' }],
    radicals: [
      { symbol: '亡', name: 'Bou', meaning: 'Vanish / Look afar', role: 'Phonetic / Component' },
      { symbol: '月', name: 'Tsuki', meaning: 'Moon', role: 'Meaning Radical' },
      { symbol: '王', name: 'Ou', meaning: 'Standing tall', role: 'Meaning Radical' },
    ],
    combinationStory: 'Standing tall (王) gazing toward the distant horizon and the moon (月) in quiet hope.',
    exampleSentence: {
      segments: [
        { text: '日本', reading: 'にほん' },
        { text: '留学', reading: 'りゅうがく' },
        { text: 'を' },
        { text: '希望', reading: 'きぼう' },
        { text: 'しています。' },
      ],
      plain: '日本留学を希望しています。',
      romaji: 'Nihon ryuugaku o kibou shite imasu.',
      english: 'I am hoping to study abroad in Japan.',
    },
  },
  {
    id: 'kanji-shouchou',
    kanji: '挑',
    level: 'N2',
    meaning: 'Challenge · Confront',
    strokes: 9,
    strokePaths: [
      'M 14 34 L 38 34',
      'M 26 14 L 26 86',
      'M 12 62 L 38 48',
      'M 52 16 L 52 84',
      'M 42 32 L 50 42',
      'M 42 66 L 52 54',
      'M 68 16 L 68 80 C 68 86 74 86 88 86',
      'M 86 30 L 70 42',
      'M 72 52 L 88 64',
    ],
    onyomi: [{ kana: 'チョウ', romaji: 'chou' }],
    kunyomi: [{ kana: 'いど(む)', romaji: 'ido(mu)' }],
    radicals: [
      { symbol: '扌', name: 'Tehon', meaning: 'Hand / Action', role: 'Meaning Radical' },
      { symbol: '兆', name: 'Chou', meaning: 'Omen / Split', role: 'Phonetic / Component' },
    ],
    combinationStory: 'Reaching out with the hand (扌) toward an omen or milestone (兆)—stepping up to a challenge.',
    exampleSentence: {
      segments: [
        { text: '今年', reading: 'ことし' },
        { text: 'こそJLPT N2に' },
        { text: '挑戦', reading: 'ちょうせん' },
        { text: 'する。' },
      ],
      plain: '今年こそJLPT N2に挑戦する。',
      romaji: 'Kotoshi koso JLPT N2 ni chousen suru.',
      english: 'This year I will definitely take on the JLPT N2 challenge.',
    },
  },
  {
    id: 'kanji-kiwameru',
    kanji: '極',
    level: 'N2',
    meaning: 'Extreme · Culmination · Pole',
    strokes: 12,
    strokePaths: [
      'M 12 34 L 36 34',
      'M 25 14 L 25 86',
      'M 25 34 L 12 64',
      'M 25 42 L 36 56',
      'M 42 22 L 88 22',
      'M 58 22 L 52 52',
      'M 46 38 L 62 38 L 62 68 L 46 68 Z',
      'M 70 38 L 86 38 C 84 56 76 68 68 74',
      'M 70 50 L 88 74',
      'M 40 84 L 90 84',
    ],
    onyomi: [
      { kana: 'キョク', romaji: 'kyoku' },
      { kana: 'ゴク', romaji: 'goku' },
    ],
    kunyomi: [{ kana: 'きわ(める)', romaji: 'kiwa(meru)' }],
    radicals: [
      { symbol: '木', name: 'Ki', meaning: 'Tree / Beam', role: 'Meaning Radical' },
      { symbol: '亟', name: 'Kyoku', meaning: 'Utmost reach', role: 'Phonetic / Component' },
    ],
    combinationStory: 'The highest ridge-beam (木) stretching to the utmost limit (亟)—reaching mastery.',
    exampleSentence: {
      segments: [
        { text: '日本語', reading: 'にほんご' },
        { text: 'の' },
        { text: '表現', reading: 'ひょうげん' },
        { text: 'を' },
        { text: '極', reading: 'きわ' },
        { text: 'めたい。' },
      ],
      plain: '日本語の表現を極めたい。',
      romaji: 'Nihongo no hyougen o kiwametai.',
      english: 'I want to master Japanese expression to its fullest.',
    },
  },
  {
    id: 'kanji-kan',
    kanji: '鑑',
    level: 'N1',
    meaning: 'Model · Mirror · Appraise',
    strokes: 23,
    strokePaths: [
      'M 26 14 L 12 42',
      'M 26 14 L 40 34',
      'M 18 42 L 34 42',
      'M 14 56 L 38 56',
      'M 26 42 L 26 82',
      'M 12 86 L 40 78',
      'M 46 20 L 62 20 L 62 56 L 46 56 Z',
      'M 72 14 L 66 36',
      'M 70 28 L 88 28',
      'M 72 46 L 86 46',
      'M 46 66 L 88 66 L 88 86 L 46 86 Z',
    ],
    onyomi: [{ kana: 'カン', romaji: 'kan' }],
    kunyomi: [{ kana: 'かがみ', romaji: 'kagami' }],
    radicals: [
      { symbol: '金', name: 'Kane', meaning: 'Polished metal', role: 'Meaning Radical' },
      { symbol: '監', name: 'Kan', meaning: 'Inspect / Look down', role: 'Phonetic / Component' },
    ],
    combinationStory: 'Polished bronze metal (金) used as a clear mirror to inspect (監) and appraise quality.',
    exampleSentence: {
      segments: [
        { text: '映画', reading: 'えいが' },
        { text: 'を' },
        { text: '鑑賞', reading: 'かんしょう' },
        { text: 'するのが' },
        { text: '趣味', reading: 'しゅみ' },
        { text: 'です。' },
      ],
      plain: '映画を鑑賞するのが趣味です。',
      romaji: 'Eiga o kanshou suru no ga shumi desu.',
      english: 'Appreciating films is my hobby.',
    },
  },
  {
    id: 'kanji-yuugen',
    kanji: '幽',
    level: 'N1',
    meaning: 'Subtle · Quiet · Secluded',
    strokes: 9,
    strokePaths: [
      'M 50 14 L 50 82',
      'M 34 26 L 24 44 L 38 44 L 24 62 L 40 62',
      'M 68 26 L 58 44 L 74 44 L 60 62 L 76 62',
      'M 18 32 L 18 82 L 82 82 L 82 32',
    ],
    onyomi: [{ kana: 'ユウ', romaji: 'yuu' }],
    kunyomi: [{ kana: 'かす(か)', romaji: 'kasu(ka)' }],
    radicals: [
      { symbol: '幺', name: 'Itogashira', meaning: 'Delicate threads', role: 'Meaning Radical' },
      { symbol: '山', name: 'Yama', meaning: 'Mountain valley', role: 'Meaning Radical' },
    ],
    combinationStory: 'Delicate silk threads (幺) tucked deep inside a misty mountain valley (山)—quiet elegance (Yūgen).',
    exampleSentence: {
      segments: [
        { text: '幽玄', reading: 'ゆうげん' },
        { text: 'な' },
        { text: '日本', reading: 'にほん' },
        { text: '庭園', reading: 'ていえん' },
        { text: '。' },
      ],
      plain: '幽玄な日本庭園。',
      romaji: 'Yuugen na Nihon teien.',
      english: 'A profoundly serene and subtle Japanese garden.',
    },
  },
];

export const SCENARIOS: ScenarioModule[] = [
  {
    id: 'scn-izakaya',
    title: 'Ordering at an Izakaya',
    japaneseTitle: '居酒屋で注文する',
    category: 'Ordering at an Izakaya',
    level: 'N5',
    unlockXp: 0,
    imageUrl: '/images/scenario_izakaya_1794753114147.jpg',
    summary: 'Order drinks, yakitori, and ask for the check smoothly in a lively Shinjuku alley izakaya.',
    lines: [
      {
        id: 'iz-1',
        speaker: '店員 (Staff)',
        role: 'Staff',
        plainJapanese: 'いらっしゃいませ！何名様ですか？',
        romaji: 'Irasshaimase! Nanmeisama desu ka?',
        english: 'Welcome! How many people in your party?',
        tokens: [
          {
            id: 'iz1-1',
            surface: 'いらっしゃいませ',
            reading: 'いらっしゃいませ',
            romaji: 'irasshaimase',
            partOfSpeech: 'Greeting (Keigo)',
            kanjiBreakdown: 'No kanji in modern signage',
            meaning: 'Welcome to our shop!',
          },
          {
            id: 'iz1-2',
            surface: '何名様',
            reading: 'なんめいさま',
            romaji: 'nanmeisama',
            partOfSpeech: 'Honorific Counter',
            kanjiBreakdown: '何 (what) + 名 (person counter) + 様 (honorific)',
            meaning: 'How many guests?',
          },
          {
            id: 'iz1-3',
            surface: 'ですか',
            reading: 'ですか',
            romaji: 'desu ka',
            partOfSpeech: 'Copula + Question',
            kanjiBreakdown: 'Polite question ending',
            meaning: 'are there?',
          },
        ],
      },
      {
        id: 'iz-2',
        speaker: 'あなた (You)',
        role: 'You',
        plainJapanese: '二人です。とりあえず生ビールを二つお願いします。',
        romaji: 'Futari desu. Toriaezu nama biiru o futatsu onegaishimasu.',
        english: 'Two people. For starters, two draft beers please.',
        tokens: [
          {
            id: 'iz2-1',
            surface: '二人',
            reading: 'ふたり',
            romaji: 'futari',
            partOfSpeech: 'Counter Noun',
            kanjiBreakdown: '二 (two) + 人 (people)',
            meaning: 'Two people',
          },
          {
            id: 'iz2-2',
            surface: 'とりあえず',
            reading: 'とりあえず',
            romaji: 'toriaezu',
            partOfSpeech: 'Adverb',
            kanjiBreakdown: '取り敢えず (for the moment)',
            meaning: 'For starters / First off',
          },
          {
            id: 'iz2-3',
            surface: '生ビール',
            reading: 'なまびーる',
            romaji: 'nama biiru',
            partOfSpeech: 'Noun',
            kanjiBreakdown: '生 (raw/draft) + ビール (beer)',
            meaning: 'Draft beer',
          },
          {
            id: 'iz2-4',
            surface: 'お願いします',
            reading: 'おねがいします',
            romaji: 'onegaishimasu',
            partOfSpeech: 'Polite Request',
            kanjiBreakdown: 'お + 願 (wish/request) + します',
            meaning: 'Please',
          },
        ],
      },
      {
        id: 'iz-3',
        speaker: 'あなた (You)',
        role: 'You',
        plainJapanese: 'すみません、お会計をお願いします。',
        romaji: 'Sumimasen, o-kaikei o onegaishimasu.',
        english: 'Excuse me, could we get the check please?',
        tokens: [
          {
            id: 'iz3-1',
            surface: 'すみません',
            reading: 'すみません',
            romaji: 'sumimasen',
            partOfSpeech: 'Expression',
            kanjiBreakdown: 'Polite attention-getter',
            meaning: 'Excuse me',
          },
          {
            id: 'iz3-2',
            surface: 'お会計',
            reading: 'おかいけい',
            romaji: 'o-kaikei',
            partOfSpeech: 'Polite Noun',
            kanjiBreakdown: 'お + 会 (meet) + 計 (calculate)',
            meaning: 'The bill / check',
          },
        ],
      },
    ],
    culturalNotes: [
      {
        title: 'Toriaezu Nama — The Classic First Order',
        registerType: 'Casual / Local Custom',
        explanation: 'At izakayas, drinks are ordered immediately upon sitting before browsing food. Saying "とりあえず生で" (draft beer for starters) is an iconic Japanese social opener.',
      },
      {
        title: 'Otoshi (お通し) Seating Appetizer',
        registerType: 'Casual / Local Custom',
        explanation: 'Staff bring a small dish automatically without you ordering it—this acts as a modest table charge (¥300–¥500) rather than a mistake.',
      },
      {
        title: 'Polite Staff vs. Friendly Patron',
        registerType: 'Honorific (Keigo)',
        explanation: 'Staff address guests with Keigo (何名様), while patrons respond warmly in standard polite Teineigo (〜お願いします).',
      },
    ],
  },
  {
    id: 'scn-station',
    title: 'Navigating Tokyo Train Stations',
    japaneseTitle: '東京駅での乗り換え',
    category: 'Navigating Tokyo Train Stations',
    level: 'N5',
    unlockXp: 0,
    imageUrl: '/images/scenario_tokyo_station_1794753114543.jpg',
    summary: 'Confirm Yamanote Line platforms, IC card gates, and express train transfers at Shibuya & Tokyo Station.',
    lines: [
      {
        id: 'st-1',
        speaker: 'あなた (You)',
        role: 'You',
        plainJapanese: 'すみません、新宿行きの山手線は何番線ですか。',
        romaji: 'Sumimasen, Shinjuku-yuki no Yamanote-sen wa nanbansen desu ka.',
        english: 'Excuse me, which platform is the Yamanote Line bound for Shinjuku?',
        tokens: [
          {
            id: 'st1-1',
            surface: '新宿行き',
            reading: 'しんじゅくゆき',
            romaji: 'Shinjuku-yuki',
            partOfSpeech: 'Compound Noun',
            kanjiBreakdown: '新 (new) + 宿 (inn) + 行 (bound for)',
            meaning: 'Bound for Shinjuku',
          },
          {
            id: 'st1-2',
            surface: '山手線',
            reading: 'やまのてせん',
            romaji: 'Yamanote-sen',
            partOfSpeech: 'Proper Noun',
            kanjiBreakdown: '山 (mountain) + 手 (hand) + 線 (line)',
            meaning: 'Yamanote Loop Line',
          },
          {
            id: 'st1-3',
            surface: '何番線',
            reading: 'なんばんせん',
            romaji: 'nanbansen',
            partOfSpeech: 'Interrogative Counter',
            kanjiBreakdown: '何 (what) + 番 (number) + 線 (track)',
            meaning: 'Which track / platform?',
          },
        ],
      },
      {
        id: 'st-2',
        speaker: '駅員 (Station Attendant)',
        role: 'Staff',
        plainJapanese: 'あちらの階段を下りて、二番線にお乗りください。',
        romaji: 'Achira no kaidan o orite, nibansen ni o-nori kudasai.',
        english: 'Go down those stairs over there and please board at Platform 2.',
        tokens: [
          {
            id: 'st2-1',
            surface: '階段',
            reading: 'かいだん',
            romaji: 'kaidan',
            partOfSpeech: 'Noun',
            kanjiBreakdown: '階 (floor/step) + 段 (tier)',
            meaning: 'Stairs',
          },
          {
            id: 'st2-2',
            surface: '下りて',
            reading: 'おりて',
            romaji: 'orite',
            partOfSpeech: 'Verb (Te-form)',
            kanjiBreakdown: '下 (down) + りて',
            meaning: 'Go down and...',
          },
          {
            id: 'st2-3',
            surface: 'お乗りください',
            reading: 'おのりください',
            romaji: 'o-nori kudasai',
            partOfSpeech: 'Polite Request (Keigo)',
            kanjiBreakdown: 'お + 乗 (ride) + ください',
            meaning: 'Please board',
          },
        ],
      },
    ],
    culturalNotes: [
      {
        title: 'Outer Loop (外回り) vs. Inner Loop (内回り)',
        registerType: 'Casual / Local Custom',
        explanation: 'The Yamanote Line is a circle: Sotoma-wari runs clockwise (Shibuya → Shinjuku → Ikebukuro), while Uchima-wari runs counter-clockwise.',
      },
      {
        title: 'お + Verb Stem + ください',
        registerType: 'Honorific (Keigo)',
        explanation: 'Station announcements replace standard 〜てください with お乗りください ("please ride") and お降りください ("please exit").',
      },
    ],
  },
  {
    id: 'scn-konbini',
    title: 'Convenience Store Etiquette',
    japaneseTitle: 'コンビニでのマナー',
    category: 'Convenience Store Etiquette',
    level: 'N5',
    unlockXp: 0,
    imageUrl: '/images/scenario_konbini_1794753115099.jpg',
    summary: 'Handle rapid-fire clerk questions at the register: warming bento, plastic bags, and IC card payment.',
    lines: [
      {
        id: 'kb-1',
        speaker: '店員 (Clerk)',
        role: 'Staff',
        plainJapanese: 'お弁当、温めますか。レジ袋はご利用ですか。',
        romaji: 'O-bentou, atatamemasu ka. Rejibukuro wa go-riyou desu ka.',
        english: 'Shall I warm up your bento? Do you need a shopping bag?',
        tokens: [
          {
            id: 'kb1-1',
            surface: 'お弁当',
            reading: 'おべんとう',
            romaji: 'o-bentou',
            partOfSpeech: 'Polite Noun',
            kanjiBreakdown: 'お + 弁 (convenient) + 当 (meal)',
            meaning: 'Boxed lunch',
          },
          {
            id: 'kb1-2',
            surface: '温めますか',
            reading: 'あたためますか',
            romaji: 'atatamemasu ka',
            partOfSpeech: 'Polite Verb',
            kanjiBreakdown: '温 (warm) + めますか',
            meaning: 'Shall I heat it up?',
          },
          {
            id: 'kb1-3',
            surface: 'レジ袋',
            reading: 'れじぶくろ',
            romaji: 'rejibukuro',
            partOfSpeech: 'Noun',
            kanjiBreakdown: 'レジ (register) + 袋 (bag)',
            meaning: 'Plastic checkout bag',
          },
        ],
      },
      {
        id: 'kb-2',
        speaker: 'あなた (You)',
        role: 'You',
        plainJapanese: 'はい、お願いします。袋は大丈夫です。Suicaで払います。',
        romaji: 'Hai, onegaishimasu. Fukuro wa daijoubu desu. Suica de haraimasu.',
        english: 'Yes, please warm it. No bag needed. I will pay with Suica.',
        tokens: [
          {
            id: 'kb2-1',
            surface: '大丈夫です',
            reading: 'だいじょうぶです',
            romaji: 'daijoubu desu',
            partOfSpeech: 'Polite Decline',
            kanjiBreakdown: '大 (big) + 丈 (stature) + 夫',
            meaning: 'No thank you / I’m fine without it',
          },
          {
            id: 'kb2-2',
            surface: '払います',
            reading: 'はらいます',
            romaji: 'haraimasu',
            partOfSpeech: 'Verb',
            kanjiBreakdown: '払 (pay) + います',
            meaning: 'I will pay',
          },
        ],
      },
    ],
    culturalNotes: [
      {
        title: 'Using 大丈夫です (Daijoubu desu) to Politely Decline',
        registerType: 'Polite (Teineigo)',
        explanation: 'Instead of saying a blunt いいえ ("No"), Japanese shoppers gently decline bags or receipts with 袋は大丈夫です.',
      },
      {
        title: 'Cash Tray Etiquette (カルトン)',
        registerType: 'Casual / Local Custom',
        explanation: 'Place cash in the small blue/silver tray on the counter rather than handing bills directly into the clerk’s hand.',
      },
    ],
  },
  {
    id: 'scn-keigo',
    title: 'Corporate Keigo & Tea Room',
    japaneseTitle: '敬語とビジネス会話',
    category: 'Corporate Keigo & Tea Room',
    level: 'N3',
    unlockXp: 150,
    imageUrl: '/images/hero_tokyo_study_1794753113727.jpg',
    summary: 'Master N3/N2 humble & honorific expressions when greeting a Japanese manager or scholarship panel.',
    lines: [
      {
        id: 'kg-1',
        speaker: 'あなた (You)',
        role: 'You',
        plainJapanese: 'お忙しいところ、お時間をいただき誠にありがとうございます。',
        romaji: 'O-isogashii tokoro, o-jikan o itadaki makoto ni arigatou gozaimasu.',
        english: 'Thank you very much for taking the time despite your busy schedule.',
        tokens: [
          {
            id: 'kg1-1',
            surface: 'お忙しい',
            reading: 'おいそがしい',
            romaji: 'o-isogashii',
            partOfSpeech: 'Honorific Adjective',
            kanjiBreakdown: 'お + 忙 (busy)',
            meaning: 'Your busy (schedule)',
          },
          {
            id: 'kg1-2',
            surface: 'いただき',
            reading: 'いただき',
            romaji: 'itadaki',
            partOfSpeech: 'Humble Verb (Kenjougo)',
            kanjiBreakdown: '頂く (humble receiving)',
            meaning: 'humbly receiving',
          },
          {
            id: 'kg1-3',
            surface: '誠に',
            reading: 'まことに',
            romaji: 'makoto ni',
            partOfSpeech: 'Formal Adverb',
            kanjiBreakdown: '誠 (sincerity) + に',
            meaning: 'Truly / Sincerely',
          },
        ],
      },
    ],
    culturalNotes: [
      {
        title: 'MEXT Interview & Office Cushion Words (クッション言葉)',
        registerType: 'Honorific (Keigo)',
        explanation: 'Phrases like お忙しいところ ("while you are busy") and 恐れ入りますが ("I am terribly sorry to trouble you, but...") are essential before any request in N3–N1 interviews.',
      },
    ],
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_kanji', title: 'First Kanji Etched', japaneseStamp: '初漢', description: 'Review and pass your first Kanji in SRS.', xpBonus: 50 },
  { id: 'kanji_5', title: 'Five Radicals Mastery', japaneseStamp: '五字', description: 'Learn 5+ Kanji across JLPT levels.', xpBonus: 120 },
  { id: 'streak_3', title: 'Three-Day Momentum', japaneseStamp: '三日', description: 'Maintain a 3-day study streak.', xpBonus: 75 },
  { id: 'streak_7', title: 'Torii Seven-Day Streak', japaneseStamp: '七日', description: 'Study Japanese 7 days in a row.', xpBonus: 200 },
  { id: 'quiz_5', title: 'Exam Sharpshooter', japaneseStamp: '合格', description: 'Answer 5+ adaptive JLPT questions correctly.', xpBonus: 100 },
  { id: 'phrasebook_3', title: 'Tokyo Fieldbook', japaneseStamp: '手帳', description: 'Bookmark 3+ phrases for offline review.', xpBonus: 60 },
  { id: 'xp_500', title: 'Kihon Graduate', japaneseStamp: '基本', description: 'Earn 500 total AkuJin XP.', xpBonus: 100 },
  { id: 'xp_1500', title: 'N2 Scholar Ascent', japaneseStamp: '飛躍', description: 'Reach 1,500 XP on your JLPT ascent.', xpBonus: 250 },
];
