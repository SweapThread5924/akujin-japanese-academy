export interface KanaGridCell {
  kana: string;
  romaji: string;
  row: string;
  col: 'a' | 'i' | 'u' | 'e' | 'o' | 'n';
  strokes: number;
  mnemonic: string;
  sampleWord: string;
  sampleReading: string;
  sampleMeaning: string;
}

export interface KanaComboItem {
  kana: string;
  romaji: string;
  group: 'Dakuten' | 'Handakuten' | 'Yoon';
  sampleWord: string;
  sampleMeaning: string;
}

export interface GreetingItem {
  id: string;
  japanese: string;
  reading: string;
  romaji: string;
  english: string;
  register: 'Polite' | 'Casual' | 'Daily Custom' | 'Business';
  usageNote: string;
}

export interface NumberTimeItem {
  id: string;
  category: 'Numbers' | 'Hours' | 'Minutes' | 'Days & Months' | 'Counters';
  japanese: string;
  reading: string;
  romaji: string;
  english: string;
  note?: string;
}

export interface VideoLessonChapter {
  id: string;
  levelTag: string;
  title: string;
  japaneseTitle: string;
  durationLabel: string;
  thumbnailUrl: string;
  instructorNote: string;
  targetTab: 'foundations' | 'lessons' | 'kanji' | 'scenarios';
  slides: {
    timestampSec: number;
    headline: string;
    japanese: string;
    reading: string;
    romaji: string;
    english: string;
    focusPoint: string;
  }[];
}

// 46 Basic Hiragana arranged by Gojuon rows (a, k, s, t, n, h, m, y, r, w + n)
export const HIRAGANA_46: KanaGridCell[] = [
  { kana: 'あ', romaji: 'a', row: 'あ-row', col: 'a', strokes: 3, mnemonic: 'Looks like an apple with a leaf stem.', sampleWord: 'あさ', sampleReading: 'asa', sampleMeaning: 'morning' },
  { kana: 'い', romaji: 'i', row: 'あ-row', col: 'i', strokes: 2, mnemonic: 'Two vertical eels swimming side by side ("ee").', sampleWord: 'いぬ', sampleReading: 'inu', sampleMeaning: 'dog' },
  { kana: 'う', romaji: 'u', row: 'あ-row', col: 'u', strokes: 2, mnemonic: 'A boxer curled up saying "oooh!".', sampleWord: 'うみ', sampleReading: 'umi', sampleMeaning: 'ocean' },
  { kana: 'え', romaji: 'e', row: 'あ-row', col: 'e', strokes: 2, mnemonic: 'An energetic exotic bird spreading wings.', sampleWord: 'えき', sampleReading: 'eki', sampleMeaning: 'station' },
  { kana: 'お', romaji: 'o', row: 'あ-row', col: 'o', strokes: 3, mnemonic: 'A golf ball on a tee ("oh, hole in one!").', sampleWord: 'おちゃ', sampleReading: 'ocha', sampleMeaning: 'green tea' },

  { kana: 'か', romaji: 'ka', row: 'か-row', col: 'a', strokes: 3, mnemonic: 'A sharp katana blade cutting bamboo.', sampleWord: 'かさ', sampleReading: 'kasa', sampleMeaning: 'umbrella' },
  { kana: 'き', romaji: 'ki', row: 'か-row', col: 'i', strokes: 4, mnemonic: 'An antique skeleton key.', sampleWord: 'きって', sampleReading: 'kitte', sampleMeaning: 'postage stamp' },
  { kana: 'く', romaji: 'ku', row: 'か-row', col: 'u', strokes: 1, mnemonic: 'The open beak of a cuckoo bird.', sampleWord: 'くつ', sampleReading: 'kutsu', sampleMeaning: 'shoes' },
  { kana: 'け', romaji: 'ke', row: 'か-row', col: 'e', strokes: 3, mnemonic: 'A wooden sake keg.', sampleWord: 'けさ', sampleReading: 'kesa', sampleMeaning: 'this morning' },
  { kana: 'こ', romaji: 'ko', row: 'か-row', col: 'o', strokes: 2, mnemonic: 'Two koi fish swimming in a pond.', sampleWord: 'こども', sampleReading: 'kodomo', sampleMeaning: 'child' },

  { kana: 'さ', romaji: 'sa', row: 'さ-row', col: 'a', strokes: 3, mnemonic: 'A samurai holding a tiny saucer.', sampleWord: 'さくら', sampleReading: 'sakura', sampleMeaning: 'cherry blossom' },
  { kana: 'し', romaji: 'shi', row: 'さ-row', col: 'i', strokes: 1, mnemonic: 'A fishing hook catching "she"-fish.', sampleWord: 'しろ', sampleReading: 'shiro', sampleMeaning: 'castle / white' },
  { kana: 'す', romaji: 'su', row: 'さ-row', col: 'u', strokes: 2, mnemonic: 'A swirl loop on a playground swing.', sampleWord: 'すし', sampleReading: 'sushi', sampleMeaning: 'sushi' },
  { kana: 'せ', romaji: 'se', row: 'さ-row', col: 'e', strokes: 3, mnemonic: 'A mouth saying "seh!".', sampleWord: 'せんせい', sampleReading: 'sensei', sampleMeaning: 'teacher' },
  { kana: 'そ', romaji: 'so', row: 'さ-row', col: 'o', strokes: 1, mnemonic: 'Zigzag stitching ("sew").', sampleWord: 'そら', sampleReading: 'sora', sampleMeaning: 'sky' },

  { kana: 'た', romaji: 'ta', row: 'た-row', col: 'a', strokes: 4, mnemonic: 'Literally spells "t" and "a" side by side.', sampleWord: 'たまご', sampleReading: 'tamago', sampleMeaning: 'egg' },
  { kana: 'ち', romaji: 'chi', row: 'た-row', col: 'i', strokes: 2, mnemonic: 'Looks like numeral 5 cheering ("chi-erleader").', sampleWord: 'ちず', sampleReading: 'chizu', sampleMeaning: 'map' },
  { kana: 'つ', romaji: 'tsu', row: 'た-row', col: 'u', strokes: 1, mnemonic: 'A curling tsunami wave.', sampleWord: 'つき', sampleReading: 'tsuki', sampleMeaning: 'moon' },
  { kana: 'て', romaji: 'te', row: 'た-row', col: 'e', strokes: 1, mnemonic: 'A curving dog tail.', sampleWord: 'てがみ', sampleReading: 'tegami', sampleMeaning: 'letter' },
  { kana: 'と', romaji: 'to', row: 'た-row', col: 'o', strokes: 2, mnemonic: 'A splinter stuck in a toe.', sampleWord: 'とり', sampleReading: 'tori', sampleMeaning: 'bird' },

  { kana: 'な', romaji: 'na', row: 'な-row', col: 'a', strokes: 4, mnemonic: 'A knot tied next to a cross.', sampleWord: 'なつ', sampleReading: 'natsu', sampleMeaning: 'summer' },
  { kana: 'に', romaji: 'ni', row: 'な-row', col: 'i', strokes: 3, mnemonic: 'A sewing needle beside two stitches ("knee").', sampleWord: 'にほん', sampleReading: 'nihon', sampleMeaning: 'Japan' },
  { kana: 'ぬ', romaji: 'nu', row: 'な-row', col: 'u', strokes: 2, mnemonic: 'Swirled ramen noodles held by chopsticks.', sampleWord: 'ぬの', sampleReading: 'nuno', sampleMeaning: 'cloth' },
  { kana: 'ね', romaji: 'ne', row: 'な-row', col: 'e', strokes: 2, mnemonic: 'A sleeping cat (neko) curled by a post.', sampleWord: 'ねこ', sampleReading: 'neko', sampleMeaning: 'cat' },
  { kana: 'の', romaji: 'no', row: 'な-row', col: 'o', strokes: 1, mnemonic: 'A circular "No Parking" sign.', sampleWord: 'のみもの', sampleReading: 'nomimono', sampleMeaning: 'beverage' },

  { kana: 'は', romaji: 'ha', row: 'は-row', col: 'a', strokes: 3, mnemonic: 'A big "H" next to a small "a" ("ha!").', sampleWord: 'はな', sampleReading: 'hana', sampleMeaning: 'flower' },
  { kana: 'ひ', romaji: 'hi', row: 'は-row', col: 'i', strokes: 1, mnemonic: 'A smiling mouth laughing "hee-hee".', sampleWord: 'ひと', sampleReading: 'hito', sampleMeaning: 'person' },
  { kana: 'ふ', romaji: 'fu', row: 'は-row', col: 'u', strokes: 4, mnemonic: 'Mount Fuji flanked by two clouds.', sampleWord: 'ふゆ', sampleReading: 'fuyu', sampleMeaning: 'winter' },
  { kana: 'へ', romaji: 'he', row: 'は-row', col: 'e', strokes: 1, mnemonic: 'Pointing up to heaven (looks identical in Katakana!).', sampleWord: 'へや', sampleReading: 'heya', sampleMeaning: 'room' },
  { kana: 'ほ', romaji: 'ho', row: 'は-row', col: 'o', strokes: 4, mnemonic: 'Same as は with a roof above ("ho-me").', sampleWord: 'ほん', sampleReading: 'hon', sampleMeaning: 'book' },

  { kana: 'ま', romaji: 'ma', row: 'ま-row', col: 'a', strokes: 3, mnemonic: 'Two parallel arms holding a mask.', sampleWord: 'まち', sampleReading: 'machi', sampleMeaning: 'town' },
  { kana: 'み', romaji: 'mi', row: 'ま-row', col: 'i', strokes: 2, mnemonic: 'Looks like the cursive number 21 ("me at 21").', sampleWord: 'みず', sampleReading: 'mizu', sampleMeaning: 'water' },
  { kana: 'む', romaji: 'mu', row: 'ま-row', col: 'u', strokes: 3, mnemonic: 'A cow face saying "moo".', sampleWord: 'むし', sampleReading: 'mushi', sampleMeaning: 'insect' },
  { kana: 'め', romaji: 'me', row: 'ま-row', col: 'e', strokes: 2, mnemonic: 'Looks like ぬ without the noodle loop ("meh").', sampleWord: 'めがね', sampleReading: 'megane', sampleMeaning: 'glasses' },
  { kana: 'も', romaji: 'mo', row: 'ま-row', col: 'o', strokes: 3, mnemonic: 'Two worms on a fishhook catching "mo-re" fish.', sampleWord: 'もり', sampleReading: 'mori', sampleMeaning: 'forest' },

  { kana: 'や', romaji: 'ya', row: 'や-row', col: 'a', strokes: 3, mnemonic: 'A horned yak head.', sampleWord: 'やま', sampleReading: 'yama', sampleMeaning: 'mountain' },
  { kana: 'ゆ', romaji: 'yu', row: 'や-row', col: 'u', strokes: 2, mnemonic: 'A hot-spring symbol — you bathe here ("yu").', sampleWord: 'ゆき', sampleReading: 'yuki', sampleMeaning: 'snow' },
  { kana: 'よ', romaji: 'yo', row: 'や-row', col: 'o', strokes: 2, mnemonic: 'A yo-yo hanging at the end of a finger.', sampleWord: 'よる', sampleReading: 'yoru', sampleMeaning: 'night' },

  { kana: 'ら', romaji: 'ra', row: 'ら-row', col: 'a', strokes: 2, mnemonic: 'A rabbit sitting with upright ears.', sampleWord: 'らいねん', sampleReading: 'rainen', sampleMeaning: 'next year' },
  { kana: 'り', romaji: 'ri', row: 'ら-row', col: 'i', strokes: 2, mnemonic: 'Two tall reeds swaying beside a river.', sampleWord: 'りんご', sampleReading: 'ringo', sampleMeaning: 'apple' },
  { kana: 'る', romaji: 'ru', row: 'ら-row', col: 'u', strokes: 1, mnemonic: 'Number 3 ending in a ruby loop.', sampleWord: 'るす', sampleReading: 'rusu', sampleMeaning: 'away from home' },
  { kana: 'れ', romaji: 're', row: 'ら-row', col: 'e', strokes: 2, mnemonic: 'Someone kneeling down ("re-st").', sampleWord: 'れいぞうこ', sampleReading: 'reizouko', sampleMeaning: 'refrigerator' },
  { kana: 'ろ', romaji: 'ro', row: 'ら-row', col: 'o', strokes: 1, mnemonic: 'Just like る with the ruby stolen ("ro-bbed").', sampleWord: 'ろく', sampleReading: 'roku', sampleMeaning: 'six' },

  { kana: 'わ', romaji: 'wa', row: 'わ-row', col: 'a', strokes: 2, mnemonic: 'A white swan with a round wing.', sampleWord: 'わたし', sampleReading: 'watashi', sampleMeaning: 'I / me' },
  { kana: 'を', romaji: 'wo (o)', row: 'わ-row', col: 'o', strokes: 3, mnemonic: 'Direct object particle ("Whoa, look at that!").', sampleWord: 'ほんをよむ', sampleReading: 'hon o yomu', sampleMeaning: 'read a book' },
  { kana: 'ん', romaji: 'n', row: 'ん-row', col: 'n', strokes: 1, mnemonic: 'Looks literally like a lowercase "n".', sampleWord: 'にほん', sampleReading: 'nihon', sampleMeaning: 'Japan' },
];

// 46 Basic Katakana arranged identically
export const KATAKANA_46: KanaGridCell[] = [
  { kana: 'ア', romaji: 'a', row: 'ア-row', col: 'a', strokes: 2, mnemonic: 'An axe blade tilted to chop.', sampleWord: 'アニメ', sampleReading: 'anime', sampleMeaning: 'anime' },
  { kana: 'イ', romaji: 'i', row: 'ア-row', col: 'i', strokes: 2, mnemonic: 'An artist easel ("ea-sel").', sampleWord: 'イベント', sampleReading: 'ibento', sampleMeaning: 'event' },
  { kana: 'ウ', romaji: 'u', row: 'ア-row', col: 'u', strokes: 3, mnemonic: 'An angular version of Hiragana う.', sampleWord: 'ウイルス', sampleReading: 'uirusu', sampleMeaning: 'virus' },
  { kana: 'エ', romaji: 'e', row: 'ア-row', col: 'e', strokes: 3, mnemonic: 'An elevator door shape ("e-levator").', sampleWord: 'エレベーター', sampleReading: 'erebeetaa', sampleMeaning: 'elevator' },
  { kana: 'オ', romaji: 'o', row: 'ア-row', col: 'o', strokes: 3, mnemonic: 'An opera singer raising an arm ("Oh!").', sampleWord: 'オレンジ', sampleReading: 'orenji', sampleMeaning: 'orange' },

  { kana: 'カ', romaji: 'ka', row: 'カ-row', col: 'a', strokes: 2, mnemonic: 'Sharp version of Hiragana か.', sampleWord: 'カメラ', sampleReading: 'kamera', sampleMeaning: 'camera' },
  { kana: 'キ', romaji: 'ki', row: 'カ-row', col: 'i', strokes: 3, mnemonic: 'The top half of Hiragana き key.', sampleWord: 'キーボード', sampleReading: 'kiiboodo', sampleMeaning: 'keyboard' },
  { kana: 'ク', romaji: 'ku', row: 'カ-row', col: 'u', strokes: 2, mnemonic: 'A chef cook’s hat profile.', sampleWord: 'クラス', sampleReading: 'kurasu', sampleMeaning: 'class' },
  { kana: 'ケ', romaji: 'ke', row: 'カ-row', col: 'e', strokes: 3, mnemonic: 'Sideways letter K ("ke").', sampleWord: 'ケーキ', sampleReading: 'keeki', sampleMeaning: 'cake' },
  { kana: 'コ', romaji: 'ko', row: 'カ-row', col: 'o', strokes: 2, mnemonic: 'A sharp 90-degree corner.', sampleWord: 'コーヒー', sampleReading: 'koohii', sampleMeaning: 'coffee' },

  { kana: 'サ', romaji: 'sa', row: 'サ-row', col: 'a', strokes: 3, mnemonic: 'Two sardines hanging from a rod.', sampleWord: 'サラダ', sampleReading: 'sarada', sampleMeaning: 'salad' },
  { kana: 'シ', romaji: 'shi', row: 'サ-row', col: 'i', strokes: 3, mnemonic: 'Smiley face winking sideways ("she grins").', sampleWord: 'シャツ', sampleReading: 'shatsu', sampleMeaning: 'shirt' },
  { kana: 'ス', romaji: 'su', row: 'サ-row', col: 'u', strokes: 2, mnemonic: 'A skier speeding down a slope ("su-ki").', sampleWord: 'スーパー', sampleReading: 'suupaa', sampleMeaning: 'supermarket' },
  { kana: 'セ', romaji: 'se', row: 'サ-row', col: 'e', strokes: 2, mnemonic: 'Angular version of Hiragana せ.', sampleWord: 'セーター', sampleReading: 'seetaa', sampleMeaning: 'sweater' },
  { kana: 'ソ', romaji: 'so', row: 'サ-row', col: 'o', strokes: 2, mnemonic: 'One dot and a steep downward line ("so steep!").', sampleWord: 'ソファ', sampleReading: 'sofa', sampleMeaning: 'sofa' },

  { kana: 'タ', romaji: 'ta', row: 'タ-row', col: 'a', strokes: 3, mnemonic: 'A folded taco shell.', sampleWord: 'タクシー', sampleReading: 'takushii', sampleMeaning: 'taxi' },
  { kana: 'チ', romaji: 'chi', row: 'タ-row', col: 'i', strokes: 3, mnemonic: 'A cheerleader doing a high kick.', sampleWord: 'チーズ', sampleReading: 'chiizu', sampleMeaning: 'cheese' },
  { kana: 'ツ', romaji: 'tsu', row: 'タ-row', col: 'u', strokes: 3, mnemonic: 'Two drops falling down onto a wave (compare with シ!).', sampleWord: 'ツアー', sampleReading: 'tsuaa', sampleMeaning: 'tour' },
  { kana: 'テ', romaji: 'te', row: 'タ-row', col: 'e', strokes: 3, mnemonic: 'A telephone pole.', sampleWord: 'テレビ', sampleReading: 'terebi', sampleMeaning: 'television' },
  { kana: 'ト', romaji: 'to', row: 'タ-row', col: 'o', strokes: 2, mnemonic: 'A totem pole with a side branch.', sampleWord: 'トマト', sampleReading: 'tomato', sampleMeaning: 'tomato' },

  { kana: 'ナ', romaji: 'na', row: 'ナ-row', col: 'a', strokes: 2, mnemonic: 'A bent knife blade ("na-ifu").', sampleWord: 'ナイフ', sampleReading: 'naifu', sampleMeaning: 'knife' },
  { kana: 'ニ', romaji: 'ni', row: 'ナ-row', col: 'i', strokes: 2, mnemonic: 'Kanji for number two (ni = 2!).', sampleWord: 'ニュース', sampleReading: 'nyuusu', sampleMeaning: 'news' },
  { kana: 'ヌ', romaji: 'nu', row: 'ナ-row', col: 'u', strokes: 2, mnemonic: 'Two crossed chopsticks picking up a noodle.', sampleWord: 'ヌードル', sampleReading: 'nuudoru', sampleMeaning: 'noodles' },
  { kana: 'ネ', romaji: 'ne', row: 'ナ-row', col: 'e', strokes: 4, mnemonic: 'A bird nest on a sturdy branch.', sampleWord: 'ネクタイ', sampleReading: 'nekutai', sampleMeaning: 'necktie' },
  { kana: 'ノ', romaji: 'no', row: 'ナ-row', col: 'o', strokes: 1, mnemonic: 'A single slash ("No!").', sampleWord: 'ノート', sampleReading: 'nooto', sampleMeaning: 'notebook' },

  { kana: 'ハ', romaji: 'ha', row: 'ハ-row', col: 'a', strokes: 2, mnemonic: 'Two halves of a laugh ("ha!").', sampleWord: 'ハンバーガー', sampleReading: 'hanbaagaa', sampleMeaning: 'hamburger' },
  { kana: 'ヒ', romaji: 'hi', row: 'ハ-row', col: 'i', strokes: 2, mnemonic: 'A person giggling ("hee!").', sampleWord: 'ヒーター', sampleReading: 'hiitaa', sampleMeaning: 'heater' },
  { kana: 'フ', romaji: 'fu', row: 'ハ-row', col: 'u', strokes: 1, mnemonic: 'Roof slope of Mount Fuji.', sampleWord: 'フルーツ', sampleReading: 'furuutsu', sampleMeaning: 'fruits' },
  { kana: 'ヘ', romaji: 'he', row: 'ハ-row', col: 'e', strokes: 1, mnemonic: 'Identical to Hiragana へ pointing to heaven.', sampleWord: 'ヘリコプター', sampleReading: 'herikoputaa', sampleMeaning: 'helicopter' },
  { kana: 'ホ', romaji: 'ho', row: 'ハ-row', col: 'o', strokes: 4, mnemonic: 'A holy cross with sparkle drops.', sampleWord: 'ホテル', sampleReading: 'hoteru', sampleMeaning: 'hotel' },

  { kana: 'マ', romaji: 'ma', row: 'マ-row', col: 'a', strokes: 2, mnemonic: 'A geometric mask chin.', sampleWord: 'マップ', sampleReading: 'mappu', sampleMeaning: 'map' },
  { kana: 'ミ', romaji: 'mi', row: 'マ-row', col: 'i', strokes: 3, mnemonic: 'Three musical bars ("do-re-mi").', sampleWord: 'ミルク', sampleReading: 'miruku', sampleMeaning: 'milk' },
  { kana: 'ム', romaji: 'mu', row: 'マ-row', col: 'u', strokes: 2, mnemonic: 'Cow horns angled sideways ("muu").', sampleWord: 'ゲーム', sampleReading: 'geemu', sampleMeaning: 'game' },
  { kana: 'メ', romaji: 'me', row: 'マ-row', col: 'e', strokes: 2, mnemonic: 'An X marking a scar over an eye ("me").', sampleWord: 'メール', sampleReading: 'meeru', sampleMeaning: 'email' },
  { kana: 'モ', romaji: 'mo', row: 'マ-row', col: 'o', strokes: 3, mnemonic: 'Square version of Hiragana も.', sampleWord: 'モノレール', sampleReading: 'monoreeru', sampleMeaning: 'monorail' },

  { kana: 'ヤ', romaji: 'ya', row: 'ヤ-row', col: 'a', strokes: 2, mnemonic: 'Sharp version of Hiragana や.', sampleWord: 'ヤング', sampleReading: 'yangu', sampleMeaning: 'young' },
  { kana: 'ユ', romaji: 'yu', row: 'ヤ-row', col: 'u', strokes: 2, mnemonic: 'Looks like a blocky U-turn ("you").', sampleWord: 'ユニフォーム', sampleReading: 'yunifoomu', sampleMeaning: 'uniform' },
  { kana: 'ヨ', romaji: 'yo', row: 'ヤ-row', col: 'o', strokes: 3, mnemonic: 'Backwards E for yo-yo.', sampleWord: 'ヨーグルト', sampleReading: 'yooguruto', sampleMeaning: 'yogurt' },

  { kana: 'ラ', romaji: 'ra', row: 'ラ-row', col: 'a', strokes: 2, mnemonic: 'A rocking chair ("ra-cking").', sampleWord: 'ラーメン', sampleReading: 'raamen', sampleMeaning: 'ramen' },
  { kana: 'リ', romaji: 'ri', row: 'ラ-row', col: 'i', strokes: 2, mnemonic: 'Straight river reeds.', sampleWord: 'リズム', sampleReading: 'rizumu', sampleMeaning: 'rhythm' },
  { kana: 'ル', romaji: 'ru', row: 'ラ-row', col: 'u', strokes: 2, mnemonic: 'Two tree roots growing down ("roo-ts").', sampleWord: 'ルール', sampleReading: 'ruuru', sampleMeaning: 'rule' },
  { kana: 'レ', romaji: 're', row: 'ラ-row', col: 'e', strokes: 1, mnemonic: 'A razor sharp blade.', sampleWord: 'レストラン', sampleReading: 'resutoran', sampleMeaning: 'restaurant' },
  { kana: 'ロ', romaji: 'ro', row: 'ラ-row', col: 'o', strokes: 3, mnemonic: 'A square robot mouth ("ro-bot").', sampleWord: 'ロボット', sampleReading: 'robotto', sampleMeaning: 'robot' },

  { kana: 'ワ', romaji: 'wa', row: 'ワ-row', col: 'a', strokes: 2, mnemonic: 'A wine glass silhouette.', sampleWord: 'ワイン', sampleReading: 'wain', sampleMeaning: 'wine' },
  { kana: 'ヲ', romaji: 'wo (o)', row: 'ワ-row', col: 'o', strokes: 3, mnemonic: 'Rare Katakana object particle.', sampleWord: 'ヲタク', sampleReading: 'otaku', sampleMeaning: 'enthusiast (stylized)' },
  { kana: 'ン', romaji: 'n', row: 'ン-row', col: 'n', strokes: 2, mnemonic: 'One dot & upward sweep (compare with ソ!).', sampleWord: 'パン', sampleReading: 'pan', sampleMeaning: 'bread' },
];

export const KANA_DAKUTEN_YOON: {
  hiragana: KanaComboItem[];
  katakana: KanaComboItem[];
} = {
  hiragana: [
    { kana: 'が・ぎ・ぐ・げ・ご', romaji: 'ga · gi · gu · ge · go', group: 'Dakuten', sampleWord: 'がっこう (gakkou)', sampleMeaning: 'school' },
    { kana: 'ざ・じ・ず・ぜ・ぞ', romaji: 'za · ji · zu · ze · zo', group: 'Dakuten', sampleWord: 'じかん (jikan)', sampleMeaning: 'time' },
    { kana: 'だ・ぢ・づ・で・ど', romaji: 'da · ji · zu · de · do', group: 'Dakuten', sampleWord: 'ともだち (tomodachi)', sampleMeaning: 'friend' },
    { kana: 'ば・び・ぶ・べ・ぼ', romaji: 'ba · bi · bu · be · bo', group: 'Dakuten', sampleWord: 'ばんごはん (bangohan)', sampleMeaning: 'dinner' },
    { kana: 'ぱ・ぴ・ぷ・ぺ・ぽ', romaji: 'pa · pi · pu · pe · po', group: 'Handakuten', sampleWord: 'きっぷ (kippu)', sampleMeaning: 'ticket' },
    { kana: 'きゃ・きゅ・きょ', romaji: 'kya · kyu · kyo', group: 'Yoon', sampleWord: 'きょう (kyou)', sampleMeaning: 'today' },
    { kana: 'しゃ・しゅ・しょ', romaji: 'sha · shu · sho', group: 'Yoon', sampleWord: 'しゃしん (shashin)', sampleMeaning: 'photograph' },
    { kana: 'ちゃ・ちゅ・ちょ', romaji: 'cha · chu · cho', group: 'Yoon', sampleWord: 'おちゃ (ocha)', sampleMeaning: 'green tea' },
    { kana: 'にゃ・にゅ・にょ', romaji: 'nya · nyu · nyo', group: 'Yoon', sampleWord: 'ぎゅうにゅう (gyuunyuu)', sampleMeaning: 'milk' },
    { kana: 'りゃ・りゅ・りょ', romaji: 'rya · ryu · ryo', group: 'Yoon', sampleWord: 'りょこう (ryokou)', sampleMeaning: 'travel' },
  ],
  katakana: [
    { kana: 'ガ・ギ・グ・ゲ・ゴ', romaji: 'ga · gi · gu · ge · go', group: 'Dakuten', sampleWord: 'ガラス (garasu)', sampleMeaning: 'glass' },
    { kana: 'ザ・ジ・ズ・ゼ・ゾ', romaji: 'za · ji · zu · ze · zo', group: 'Dakuten', sampleWord: 'ジーンズ (jiinzu)', sampleMeaning: 'jeans' },
    { kana: 'ダ・ヂ・ヅ・デ・ド', romaji: 'da · ji · zu · de · do', group: 'Dakuten', sampleWord: 'ドア (doa)', sampleMeaning: 'door' },
    { kana: 'バ・ビ・ブ・ベ・ボ', romaji: 'ba · bi · bu · be · bo', group: 'Dakuten', sampleWord: 'バス (basu)', sampleMeaning: 'bus' },
    { kana: 'パ・ピ・プ・ペ・ポ', romaji: 'pa · pi · pu · pe · po', group: 'Handakuten', sampleWord: 'パソコン (pasokon)', sampleMeaning: 'PC' },
    { kana: 'キャ・キュ・キョ', romaji: 'kya · kyu · kyo', group: 'Yoon', sampleWord: 'キャンプ (kyanpu)', sampleMeaning: 'camp' },
    { kana: 'シャ・シュ・ショ', romaji: 'sha · shu · sho', group: 'Yoon', sampleWord: 'シャワー (shawaa)', sampleMeaning: 'shower' },
    { kana: 'チャ・チュ・チョ', romaji: 'cha · chu · cho', group: 'Yoon', sampleWord: 'チョコレート (chokoreeto)', sampleMeaning: 'chocolate' },
    { kana: 'ティ・ディ・ファ・フィ', romaji: 'ti · di · fa · fi', group: 'Yoon', sampleWord: 'パーティー (paatii)', sampleMeaning: 'party' },
  ],
};

export const BASIC_GREETINGS: GreetingItem[] = [
  { id: 'gr-1', japanese: 'おはようございます', reading: 'おはようございます', romaji: 'Ohayou gozaimasu', english: 'Good morning (polite)', register: 'Polite', usageNote: 'Used until around 10:30 AM, or anytime you first greet colleagues at work.' },
  { id: 'gr-2', japanese: 'おはよう', reading: 'おはよう', romaji: 'Ohayou', english: 'Morning! (casual)', register: 'Casual', usageNote: 'Use with close friends and family.' },
  { id: 'gr-3', japanese: 'こんにちは', reading: 'こんにちは', romaji: 'Konnichiwa', english: 'Hello / Good afternoon', register: 'Polite', usageNote: 'Written with は (ha) pronounced wa! Used late morning until sunset.' },
  { id: 'gr-4', japanese: 'こんばんは', reading: 'こんばんは', romaji: 'Konbanwa', english: 'Good evening', register: 'Polite', usageNote: 'Also ends with は pronounced wa; used after dark.' },
  { id: 'gr-5', japanese: 'おやすみなさい', reading: 'おやすみなさい', romaji: 'Oyasuminasai', english: 'Good night', register: 'Polite', usageNote: 'Said before going to sleep or parting late at night.' },
  { id: 'gr-6', japanese: 'はじめまして', reading: 'はじめまして', romaji: 'Hajimemashite', english: 'Nice to meet you (first time)', register: 'Polite', usageNote: 'The very first sentence in any Japanese self-introduction (jikoshoukai).' },
  { id: 'gr-7', japanese: 'よろしくお願いします', reading: 'よろしくおねがいします', romaji: 'Yoroshiku onegaishimasu', english: 'Pleased to meet you / Please treat me well', register: 'Polite', usageNote: 'Essential closing line of a self-introduction or polite request.' },
  { id: 'gr-8', japanese: 'ありがとうございます', reading: 'ありがとうございます', romaji: 'Arigatou gozaimasu', english: 'Thank you very much', register: 'Polite', usageNote: 'Add ございました (gozaimashita) when thanking for something just completed.' },
  { id: 'gr-9', japanese: 'すみません', reading: 'すみません', romaji: 'Sumimasen', english: 'Excuse me / I am sorry', register: 'Polite', usageNote: 'Multipurpose polite phrase to call staff, pass by, or apologize lightly.' },
  { id: 'gr-10', japanese: 'ごめんなさい', reading: 'ごめんなさい', romaji: 'Gomen nasai', english: 'I am sorry (apology)', register: 'Casual', usageNote: 'Warm personal apology; more emotional than すみません.' },
  { id: 'gr-11', japanese: 'いただきます', reading: 'いただきます', romaji: 'Itadakimasu', english: 'Thank you for the meal (before eating)', register: 'Daily Custom', usageNote: 'Press palms together lightly before starting any meal.' },
  { id: 'gr-12', japanese: 'ごちそうさまでした', reading: 'ごちそうさまでした', romaji: 'Gochisousama deshita', english: 'Thank you for the delicious meal (after eating)', register: 'Daily Custom', usageNote: 'Said to hosts or restaurant staff when finishing a meal.' },
  { id: 'gr-13', japanese: 'いってきます', reading: 'いってきます', romaji: 'Ittekimasu', english: "I'm heading out (and coming back)", register: 'Daily Custom', usageNote: 'Said when leaving home or the office temporarily.' },
  { id: 'gr-14', japanese: 'いってらっしゃい', reading: 'いってらっしゃい', romaji: 'Itterasshai', english: 'Have a safe trip / See you later', register: 'Daily Custom', usageNote: 'The standard reply when someone says いってきます.' },
  { id: 'gr-15', japanese: 'ただいま', reading: 'ただいま', romaji: 'Tadaima', english: "I'm home / I'm back", register: 'Daily Custom', usageNote: 'Short for ただいま戻りました (I just returned).' },
  { id: 'gr-16', japanese: 'おかえりなさい', reading: 'おかえりなさい', romaji: 'Okaerinasai', english: 'Welcome home', register: 'Daily Custom', usageNote: 'The warm reply to ただいま.' },
  { id: 'gr-17', japanese: 'お疲れ様です', reading: 'おつかれさまです', romaji: 'Otsukaresama desu', english: 'Good work today / Thanks for your effort', register: 'Business', usageNote: 'Japan’s most important workplace greeting when passing coworkers or finishing shifts.' },
  { id: 'gr-18', japanese: '失礼します', reading: 'しつれいします', romaji: 'Shitsurei shimasu', english: 'Excuse me (entering/leaving a room)', register: 'Business', usageNote: 'Said before entering a teacher’s/boss’s room or leaving work early.' },
];

export const NUMBERS_TIME_BASICS: NumberTimeItem[] = [
  { id: 'nt-1', category: 'Numbers', japanese: '一・二・三・四・五', reading: 'いち・に・さん・よん・ご', romaji: 'ichi · ni · san · yon (shi) · go', english: '1, 2, 3, 4, 5', note: '4 is read よん or し; 7 is なな or しち; 9 is きゅう or く.' },
  { id: 'nt-2', category: 'Numbers', japanese: '六・七・八・九・十', reading: 'ろく・なな・はち・きゅう・じゅう', romaji: 'roku · nana · hachi · kyuu · juu', english: '6, 7, 8, 9, 10' },
  { id: 'nt-3', category: 'Numbers', japanese: '百・千・一万', reading: 'ひゃく・せん・いちまん', romaji: 'hyaku · sen · ichiman', english: '100 · 1,000 · 10,000', note: 'Watch sound shifts: 300 = さんびゃく, 600 = ろっぴゃく, 800 = はっぴゃく.' },
  { id: 'nt-4', category: 'Hours', japanese: '一時・二時・三時・四時', reading: 'いちじ・にじ・さんじ・よじ', romaji: 'ichiji · niji · sanji · yoji', english: '1:00, 2:00, 3:00, 4:00', note: 'Exam trap: 4 o’clock is always よじ (never よんじ).' },
  { id: 'nt-5', category: 'Hours', japanese: '七時・九時・十二時半', reading: 'しちじ・くじ・じゅうにじはん', romaji: 'shichiji · kuji · juuniji han', english: '7:00, 9:00, 12:30', note: '7:00 = しちじ, 9:00 = くじ; 半 (han) = half past.' },
  { id: 'nt-6', category: 'Minutes', japanese: '一分・五分・十分・十五分', reading: 'いっぷん・ごふん・じゅっぷん・じゅうごふん', romaji: 'ippun · gofun · juppun · juugofun', english: '1 min · 5 min · 10 min · 15 min', note: '1, 3, 4, 6, 8, 10 take ぷん (pun): いっぷん, さんぷん, ろっぷん, はっぷん, じゅっぷん.' },
  { id: 'nt-7', category: 'Days & Months', japanese: '月・火・水・木・金・土・日曜日', reading: 'げつ・か・すい・もく・きん・ど・にちようび', romaji: 'getsu · ka · sui · moku · kin · do · nichiyoubi', english: 'Mon · Tue · Wed · Thu · Fri · Sat · Sun', note: 'Memory aid: Moon, Fire, Water, Wood, Gold, Earth, Sun!' },
  { id: 'nt-8', category: 'Days & Months', japanese: '四月・七月・九月', reading: 'しがつ・しちがつ・くがつ', romaji: 'shigatsu · shichigatsu · kugatsu', english: 'April · July · September', note: 'Months 4, 7, 9 strictly use し・しち・く + がつ.' },
  { id: 'nt-9', category: 'Counters', japanese: 'ひとつ・ふたつ・みっつ・いくつ', reading: 'ひとつ・ふたつ・みっつ・いくつ', romaji: 'hitotsu · futatsu · mittsu · ikutsu', english: '1, 2, 3 general items · How many?' },
  { id: 'nt-10', category: 'Counters', japanese: '一人・二人・三人', reading: 'ひとり・ふたり・さんにん', romaji: 'hitori · futari · sannin', english: '1 person · 2 people · 3 people', note: '1 and 2 people are irregular (hitori, futari); 3+ use 〜にん.' },
];

export const VIDEO_LESSONS: VideoLessonChapter[] = [
  {
    id: 'vid-hiragana',
    levelTag: '00 · Foundations',
    title: 'All 46 Hiragana: Sound, Shape & Stroke Flow',
    japaneseTitle: 'ひらがな46文字の基礎',
    durationLabel: '03:20 Interactive Lesson',
    thumbnailUrl: '/images/video_kana_masterclass_1794838254525.jpg',
    instructorNote: 'Master the 5 clean Japanese vowels (あいうえお) first—every syllable in Hiragana builds from these 5 pure sounds.',
    targetTab: 'foundations',
    slides: [
      {
        timestampSec: 0,
        headline: 'Chapter 1 · Pure 5-Vowel Anchor',
        japanese: 'あ・い・う・え・お',
        reading: 'あ・い・う・え・お',
        romaji: 'a · i · u · e · o',
        english: 'Every Japanese syllable holds an equal beat (mora). Keep vowels crisp without English glide.',
        focusPoint: 'Equal beat timing: あ (a) = 1 beat, おかあさん = 5 beats.',
      },
      {
        timestampSec: 8,
        headline: 'Chapter 2 · K, S, T Rows & Sound Shifts',
        japanese: 'かきくけこ・さしすせそ・たちつてと',
        reading: 'かきくけこ・さしすせそ・たちつてと',
        romaji: 'ka-ki-ku-ke-ko · sa-shi-su-se-so · ta-chi-tsu-te-to',
        english: 'Notice three irregular sounds: し (shi), ち (chi), and つ (tsu).',
        focusPoint: 'Add dakuten (゛) to turn か→が (ga), さ→ざ (za), た→だ (da).',
      },
      {
        timestampSec: 16,
        headline: 'Chapter 3 · Final Nasals & Direct Particle を',
        japanese: 'わたしはにほんごをべんきょうします。',
        reading: 'わたし は にほんご を べんきょう します。',
        romaji: 'Watashi wa Nihongo o benkyou shimasu.',
        english: 'I study Japanese. Notice は is pronounced "wa" as topic marker and を is pronounced "o".',
        focusPoint: 'You just read your first complete Japanese sentence!',
      },
    ],
  },
  {
    id: 'vid-greetings',
    levelTag: '00 · Basics & Etiquette',
    title: 'Daily Japanese Greetings, Numbers & Telling Time',
    japaneseTitle: '挨拶・数字・時間の基本',
    durationLabel: '02:45 Interactive Lesson',
    thumbnailUrl: '/images/hero_sakura_campus_1794838253788.jpg',
    instructorNote: 'Japanese greetings shift smoothly by time of day and social setting—master these 6 phrases before starting N5 grammar.',
    targetTab: 'foundations',
    slides: [
      {
        timestampSec: 0,
        headline: 'Chapter 1 · Morning to Evening Cycle',
        japanese: 'おはようございます。こんにちは。こんばんは。',
        reading: 'おはようございます。こんにちは。こんばんは。',
        romaji: 'Ohayou gozaimasu. Konnichiwa. Konbanwa.',
        english: 'Good morning. Good afternoon. Good evening.',
        focusPoint: 'Never say おはようございます in the evening except in hospitality/film crews!',
      },
      {
        timestampSec: 8,
        headline: 'Chapter 2 · First Introductions',
        japanese: 'はじめまして。アンシュルです。よろしくお願いします。',
        reading: 'はじめまして。あんしゅる です。よろしく おねがいします。',
        romaji: 'Hajimemashite. Anshuru desu. Yoroshiku onegaishimasu.',
        english: 'Nice to meet you. I am Anshul. Please treat me kindly.',
        focusPoint: 'Pair a light 15-degree bow at よろしくお願いします.',
      },
      {
        timestampSec: 16,
        headline: 'Chapter 3 · Essential Time & Days',
        japanese: 'いまは月曜日の九時十五分です。',
        reading: 'いま は げつようび の くじ じゅうごふん です。',
        romaji: 'Ima wa getsuyoubi no kuji juugofun desu.',
        english: 'Right now it is Monday at 9:15.',
        focusPoint: '9:00 is always くじ (kuji), 4:00 is よじ (yoji), 7:00 is しちじ (shichiji).',
      },
    ],
  },
  {
    id: 'vid-jlpt-blueprint',
    levelTag: 'N5 → N1 Strategy',
    title: 'JLPT N5 to N1 Complete Exam Blueprint',
    japaneseTitle: 'JLPT N5〜N1 合格戦略',
    durationLabel: '04:10 Strategy Masterclass',
    thumbnailUrl: '/images/video_jlpt_prep_1794838254527.jpg',
    instructorNote: 'How to pace Kanji, Vocabulary, Grammar, Reading & Listening across all 5 JLPT tiers without burning out.',
    targetTab: 'lessons',
    slides: [
      {
        timestampSec: 0,
        headline: 'N5 & N4 Foundation Build (450 hrs)',
        japanese: '基本の漢字100字と語彙800語を固める。',
        reading: 'きほん の かんじ ひゃくじ と ごい はっぴゃくご を かためる。',
        romaji: 'Kihon no kanji hyaku-ji to goi happyaku-go o katameru.',
        english: 'Solidify 100 core Kanji and 800 vocabulary words at N5 before scaling to N4 casual speech.',
        focusPoint: 'Use spaced repetition (SRS) + audio shadowing daily.',
      },
      {
        timestampSec: 8,
        headline: 'N3 Bridge to Natural Media',
        japanese: '接続詞と敬語を押さえて、会話と長文を速く読む。',
        reading: 'せつぞくし と けいご を おさえて、 かいわ と ちょうぶん を はやく よむ。',
        romaji: 'Setsuzokushi to keigo o osaete, kaiwa to choubun o hayaku yomu.',
        english: 'Master conjunctions and Keigo to read authentic essays and understand natural dialogue.',
        focusPoint: 'Track contrast markers (ところが・しかし) to solve N3–N2 reading questions 2x faster.',
      },
      {
        timestampSec: 16,
        headline: 'N2 & N1 Career & Academic Fluency',
        japanese: '日本語能力試験N1で、専門記事も自在に理解する。',
        reading: 'にほんご のうりょく しけん エヌいち で、 せんもん きじ も じざいに りかい する。',
        romaji: 'Nihongo Nouryoku Shiken Enu-ichi de, senmon kiji mo jizai ni rikai suru.',
        english: 'With JLPT N1 mastery, comprehend specialized essays, nuances, and diplomatic Keigo effortlessly.',
        focusPoint: 'Practice all 6 separate skill labs inside AkuJin JLPT Studio.',
      },
    ],
  },
  {
    id: 'vid-tokyo-immersion',
    levelTag: 'Real-World Speaking',
    title: 'Tokyo Street Immersion: Izakaya, Station & Konbini',
    japaneseTitle: '東京リアル会話シミュレーション',
    durationLabel: '03:05 Immersion Walkthrough',
    thumbnailUrl: '/images/video_tokyo_conversation_1794838256337.jpg',
    instructorNote: 'Hear how textbook Japanese shifts in real Tokyo alleys, train transfers, and 24-hour convenience stores.',
    targetTab: 'scenarios',
    slides: [
      {
        timestampSec: 0,
        headline: 'Scene 1 · Shinjuku Station Transfer',
        japanese: 'すみません、新宿行きの山手線は何番線ですか。',
        reading: 'すみません、 しんじゅくゆき の やまのてせん は なんばんせん です か。',
        romaji: 'Sumimasen, Shinjuku-yuki no Yamanote-sen wa nanbansen desu ka.',
        english: 'Excuse me, which platform is the Yamanote Line bound for Shinjuku?',
        focusPoint: '〜行き (yuki) = bound for · 何番線 = which track number.',
      },
      {
        timestampSec: 8,
        headline: 'Scene 2 · Convenience Store Speed Check',
        japanese: 'お弁当、温めますか。袋は大丈夫です。',
        reading: 'おべんとう、 あたためます か。 ふくろ は だいじょうぶ です。',
        romaji: 'O-bentou, atatamemasu ka. Fukuro wa daijoubu desu.',
        english: 'Warm up your bento? No bag needed, thank you.',
        focusPoint: '大丈夫です (daijoubu desu) gently declines bags, cutlery, or receipts.',
      },
      {
        timestampSec: 16,
        headline: 'Scene 3 · Evening Izakaya Order',
        japanese: 'とりあえず生ビールを二つお願いします。',
        reading: 'とりあえず なまびーる を ふたつ おねがいします。',
        romaji: 'Toriaezu nama biiru o futatsu onegaishimasu.',
        english: 'Two draft beers for starters, please!',
        focusPoint: 'Practice word-by-word breakdown inside the Scenarios tab.',
      },
    ],
  },
];
