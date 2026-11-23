export interface PdfResourceItem {
  id: string;
  slug: string;
  title: string;
  levelRange: string;
  category: 'Textbook Companion' | 'Kanji' | 'Vocabulary' | 'Kana & Writing' | 'Official OER';
  summary: string;
  highlights: string[];
  pdfEndpoint?: string;
  sheetEndpoint?: string;
  officialUrl: string;
  officialLabel: string;
}

export interface VideoChannelItem {
  id: string;
  name: string;
  handle: string;
  category: 'Beginners & Kana' | 'Grammar & Nuances' | 'JLPT N5–N1 Prep' | 'Listening & Pitch Accent';
  levelSpan: string;
  url: string;
  image?: string;
  accentKanji: string;
  summary: string;
  communityConsensus: string;
  recommendedFor: string[];
}

export const PDF_BOOK_RESOURCES: PdfResourceItem[] = [
  {
    id: 'res-kana-wb',
    slug: 'kana-workbook',
    title: 'All 46 Hiragana & 46 Katakana Stroke Workbook',
    levelRange: 'Zero → Pre-N5',
    category: 'Kana & Writing',
    summary:
      'Printable tracing grid sheets for every basic gojūon character, dakuten, handakuten, and yōon combination with mnemonic cues.',
    highlights: ['46 Hiragana + 46 Katakana', 'Stroke order arrows & romaji table', 'Greetings & 1–100 numbers sheet'],
    pdfEndpoint: '/api/resources/pdf/kana-workbook',
    sheetEndpoint: '/api/resources/sheet/kana-workbook',
    officialUrl: 'https://www.nhk.or.jp/lesson/en/',
    officialLabel: 'NHK Easy Japanese Kana',
  },
  {
    id: 'res-genki',
    slug: 'genki-companion',
    title: 'Genki I & II Structured Companion & Practice Guide',
    levelRange: 'JLPT N5 → N4',
    category: 'Textbook Companion',
    summary:
      'Chapter-by-chapter study checklist, verb conjugation cheat sheets (て-form, ない-form, potential, passive), and Self-Study Room links.',
    highlights: ['Chapters 1–23 mastery tracker', 'Particle & conjugation summary', 'Paired with ToKini Andy video walkthroughs'],
    pdfEndpoint: '/api/resources/pdf/genki-companion',
    sheetEndpoint: '/api/resources/sheet/genki-companion',
    officialUrl: 'https://genki3.japantimes.co.jp/en/student/',
    officialLabel: 'Official Genki 3rd Ed. Portal',
  },
  {
    id: 'res-minna',
    slug: 'minna-companion',
    title: 'Minna no Nihongo N5–N4 Pattern & Vocab Companion',
    levelRange: 'JLPT N5 → N4',
    category: 'Textbook Companion',
    summary:
      'Structured sentence patterns (Bunkei), core conversational drills (Reibun), and transitivity verb pairs across Lessons 1–50.',
    highlights: ['Lessons 1–50 grammar roadmap', 'Teineigo polite speech drills', 'Paired with NihonGoal lessons'],
    pdfEndpoint: '/api/resources/pdf/minna-companion',
    sheetEndpoint: '/api/resources/sheet/minna-companion',
    officialUrl: 'https://www.3anet.co.jp/np/en/list.html?s=minna',
    officialLabel: '3A Corp Official Minna Portal',
  },
  {
    id: 'res-kanji-2136',
    slug: 'kanji-2136',
    title: 'Complete 2,136 Jōyō Kanji Master Compendium',
    levelRange: 'JLPT N5 → N1',
    category: 'Kanji',
    summary:
      'Every single official Japanese Jōyō kanji arranged by JLPT level (N5 through N1), stroke count, on’yomi, kun’yomi, and high-frequency words.',
    highlights: ['All 2,136 Jōyō characters', 'N5 (104) → N1 (2,136 cumulative)', 'Stroke & radical classification'],
    pdfEndpoint: '/api/resources/pdf/kanji-2136',
    sheetEndpoint: '/api/resources/sheet/kanji-2136',
    officialUrl: 'https://kanjiapi.dev/',
    officialLabel: 'Kanji Reference Index',
  },
  {
    id: 'res-vocab-n5-n1',
    slug: 'vocab-n5',
    title: 'JLPT N5–N1 Complete 10,000-Word Vocabulary Compendiums',
    levelRange: '800 → 10,000 Words',
    category: 'Vocabulary',
    summary:
      'Level-segmented printable vocabulary sheets covering N5 (800), N4 (700), N3 (2,250), N2 (2,250), and N1 (4,000) core tested words.',
    highlights: ['Kana reading + Hepburn romaji', 'Part-of-speech & frequency tags', '10,000 cumulative lexicon coverage'],
    pdfEndpoint: '/api/resources/pdf/vocab-n5',
    sheetEndpoint: '/api/resources/sheet/vocab-n5',
    officialUrl: 'https://www.jlpt.jp/e/samples/forlearners.html',
    officialLabel: 'Official JLPT Sample PDFs',
  },
  {
    id: 'res-irodori-taekim',
    slug: 'taekim-irodori-guide',
    title: 'Japan Foundation IRODORI & Tae Kim Free Grammar Books',
    levelRange: 'Beginner → Upper-Int',
    category: 'Official OER',
    summary:
      '100% free legal textbooks for real life in Japan (IRODORI Starter/Elementary PDFs) plus Tae Kim’s Complete Japanese Grammar Guide.',
    highlights: ['Official free PDF downloads', 'Tae Kim complete grammar guide', 'Life-in-Japan audio dialogues included'],
    pdfEndpoint: '/api/resources/pdf/grammar-guide',
    sheetEndpoint: '/api/resources/sheet/grammar-guide',
    officialUrl: 'https://www.irodori.jpf.go.jp/en/',
    officialLabel: 'Download Official IRODORI PDFs',
  },
];

export const VIDEO_CHANNELS: VideoChannelItem[] = [
  {
    id: 'yt-nihongoal',
    name: 'NihonGoal',
    handle: '@NihonGoal',
    category: 'Beginners & Kana',
    levelSpan: 'Zero · N5 · N4',
    url: 'https://www.youtube.com/c/NihonGoal',
    image: '/images/video_kana_masterclass_1794838254525.jpg',
    accentKanji: '標',
    summary:
      'Step-by-step Minna no Nihongo chapter lessons, clear visual grammar slides, listening tests, and beginner-friendly Japanese explanations.',
    communityConsensus:
      'Go-to structured playlist for self-learners following Minna no Nihongo from lesson 1 upward.',
    recommendedFor: ['Minna no Nihongo learners', 'N5 & N4 vocabulary review', 'Clear slide-based pacing'],
  },
  {
    id: 'yt-tokini-andy',
    name: 'ToKini Andy',
    handle: '@ToKiniAndy',
    category: 'Grammar & Nuances',
    levelSpan: 'N5 · N4 · N3',
    url: 'https://www.youtube.com/ToKiniAndy',
    image: '/images/video_jlpt_prep_1794838254527.jpg',
    accentKanji: '文',
    summary:
      'Comprehensive Genki I, Genki II, and Quartet walkthrough lectures filmed in Japan with practical nuance comparisons and live learner Q&A.',
    communityConsensus:
      'Widely praised as the clearest free video companion to the Genki textbook series.',
    recommendedFor: ['Genki I & II students', 'Practical spoken vs textbook Japanese', 'Structured weekly milestones'],
  },
  {
    id: 'yt-misa',
    name: 'Japanese Ammo with Misa',
    handle: '@JapaneseAmmowithMisa',
    category: 'Grammar & Nuances',
    levelSpan: 'Beginner → N3',
    url: 'https://www.youtube.com/@JapaneseAmmowithMisa',
    accentKanji: '助',
    summary:
      'Explains why grammar and particles actually work rather than just listing dry textbook rules, making core concepts like は vs が and て-form effortless to grasp.',
    communityConsensus:
      'Highlighted in the Atlas Runa Japanese YouTube Channels Guide for intuitive particle & grammar depth.',
    recommendedFor: ['Particle mastery (は/が/に/で)', 'Natural casual vs polite nuance', 'Deep conceptual clarity'],
  },
  {
    id: 'yt-nihongo-no-mori',
    name: 'Nihongo no Mori',
    handle: '@nihongonomori2013',
    category: 'JLPT N5–N1 Prep',
    levelSpan: 'JLPT N5 → N1',
    url: 'https://www.youtube.com/@nihongonomori2013',
    image: '/images/video_tokyo_conversation_1794838256337.jpg',
    accentKanji: '森',
    summary:
      'Structured lessons taught directly in Japanese with clear visual slides covering JLPT grammar, high-frequency vocabulary, kanji, and real test practice.',
    communityConsensus:
      'Recommended in the Lexpresso Guide and r/LearnJapanese consensus for comprehensible input and N3–N1 exam preparation.',
    recommendedFor: ['JLPT N3, N2 & N1 exam prep', 'Comprehensible Japanese immersion', 'Live grammar contrasts'],
  },
  {
    id: 'yt-shun',
    name: 'Japanese with Shun',
    handle: '@JapanesewithShun',
    category: 'Listening & Pitch Accent',
    levelSpan: 'JLPT N5 – N4',
    url: 'https://www.youtube.com/@JapanesewithShun',
    accentKanji: '聴',
    summary:
      'Short, accessible podcasts and real-life vlogs around daily routines and travel in Japan spoken cleanly at early-learner speed with subtitles.',
    communityConsensus:
      'Featured in the Atlas Runa Japanese YouTube Channels Guide as an ideal bridge into real spoken listening for N5–N4 learners.',
    recommendedFor: ['N5–N4 daily listening', 'Shadowing short travel vlogs', 'Stress-free immersion habit'],
  },
  {
    id: 'yt-learn-japanese',
    name: 'Learn Japanese Channel & Shibasaki',
    handle: 'Kana, Kanji & Slow Visual Input',
    category: 'Beginners & Kana',
    levelSpan: 'Zero · N5 · N4',
    url: 'https://www.youtube.com/@LearnJapaneseChannel',
    accentKanji: '筆',
    summary:
      'Dedicated reading and writing practice for Hiragana, Katakana, and foundational N5/N4 kanji alongside beginner dialogues—plus Watercolor by Shibasaki for calm, slow visual Japanese listening.',
    communityConsensus:
      'Community groups frequently pair Learn Japanese Channel stroke drills with Watercolor by Shibasaki for relaxing visual comprehension.',
    recommendedFor: ['Kana & kanji writing habits', 'Gentle slow speech listening', 'Zero-stress visual reinforcement'],
  },
  {
    id: 'yt-dogen',
    name: 'Dogen',
    handle: '@Dogen',
    category: 'Listening & Pitch Accent',
    levelSpan: 'All Levels · N5–N1',
    url: 'https://www.youtube.com/@Dogen',
    accentKanji: '音',
    summary:
      'Covers Japanese pitch accent, mora timing, and natural pronunciation through memorable comedy sketches and sharp phonetics breakdowns.',
    communityConsensus:
      'Featured in the Atlas Runa Guide as the premier resource for fixing flat English intonation and sounding genuinely natural.',
    recommendedFor: ['Tokyo pitch accent awareness', 'Clean mora & vowel rhythm', 'Fun cultural comedy sketches'],
  },
];
