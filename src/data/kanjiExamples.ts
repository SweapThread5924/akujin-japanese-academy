import type { FuriganaSegment, KanjiCard } from './curriculumData';
import type { JlptLevel } from '../utils/srsEngine';

export interface KanjiExampleSentence {
  id: string;
  level: JlptLevel;
  segments: FuriganaSegment[];
  plain: string;
  romaji: string;
  english: string;
}

/**
 * Additional curated, JLPT-level-appropriate example sentences for each SRS Kanji card
 * (2 extra per card, paired with `card.exampleSentence` to form 3 rich full sentences).
 */
const EXTRA_KANJI_SENTENCES: Record<string, Omit<KanjiExampleSentence, 'id' | 'level'>[]> = {
  'kanji-yasumu': [
    {
      segments: [
        { text: '少', reading: 'すこ' },
        { text: 'し' },
        { text: '休', reading: 'やす' },
        { text: 'んでから、' },
        { text: '勉強', reading: 'べんきょう' },
        { text: 'しましょう。' },
      ],
      plain: '少し休んでから、勉強しましょう。',
      romaji: 'Sukoshi yasunde kara, benkyou shimashou.',
      english: 'Let’s rest a little and then study.',
    },
    {
      segments: [
        { text: '夏休', reading: 'なつやす' },
        { text: 'みに' },
        { text: '友', reading: 'とも' },
        { text: 'だちと' },
        { text: '海', reading: 'うみ' },
        { text: 'へ' },
        { text: '行', reading: 'い' },
        { text: 'きます。' },
      ],
      plain: '夏休みに友だちと海へ行きます。',
      romaji: 'Natsuyasumi ni tomodachi to umi e ikimasu.',
      english: 'I will go to the beach with friends during summer vacation.',
    },
  ],
  'kanji-miru': [
    {
      segments: [
        { text: '毎晩', reading: 'まいばん' },
        { text: '、' },
        { text: '家族', reading: 'かぞく' },
        { text: 'と' },
        { text: 'テレビを' },
        { text: '見', reading: 'み' },
        { text: 'ます。' },
      ],
      plain: '毎晩、家族とテレビを見ます。',
      romaji: 'Maiban, kazoku to terebi o mimasu.',
      english: 'Every evening, I watch television with my family.',
    },
    {
      segments: [
        { text: 'その' },
        { text: '写真', reading: 'しゃしん' },
        { text: 'を' },
        { text: '見', reading: 'み' },
        { text: 'せてください。' },
      ],
      plain: 'その写真を見せてください。',
      romaji: 'Sono shashin o misete kudasai.',
      english: 'Please show me that photograph.',
    },
  ],
  'kanji-eki': [
    {
      segments: [
        { text: '駅前', reading: 'えきまえ' },
        { text: 'の' },
        { text: '本屋', reading: 'ほんや' },
        { text: 'で' },
        { text: '辞書', reading: 'じしょ' },
        { text: 'を' },
        { text: '買', reading: 'か' },
        { text: 'いました。' },
      ],
      plain: '駅前の本屋で辞書を買いました。',
      romaji: 'Ekimae no honya de jisho o kaimashita.',
      english: 'I bought a dictionary at the bookstore in front of the station.',
    },
    {
      segments: [
        { text: '家', reading: 'いえ' },
        { text: 'から' },
        { text: '駅', reading: 'えき' },
        { text: 'まで' },
        { text: '歩', reading: 'ある' },
        { text: 'いて' },
        { text: '十分', reading: 'じゅっぷん' },
        { text: 'かかります。' },
      ],
      plain: '家から駅まで歩いて十分かかります。',
      romaji: 'Ie kara eki made aruite juppun kakarimasu.',
      english: 'It takes ten minutes on foot from my house to the station.',
    },
  ],
  'kanji-akarui': [
    {
      segments: [
        { text: '明日', reading: 'あした' },
        { text: 'の' },
        { text: '午前', reading: 'ごぜん' },
        { text: 'に' },
        { text: '試験', reading: 'しけん' },
        { text: 'の' },
        { text: '説明', reading: 'せつめい' },
        { text: 'があります。' },
      ],
      plain: '明日の午前に試験の説明があります。',
      romaji: 'Ashita no gozen ni shiken no setsumei ga arimasu.',
      english: 'There is an explanation about the exam tomorrow morning.',
    },
    {
      segments: [
        { text: '彼女', reading: 'かのじょ' },
        { text: 'はいつも' },
        { text: '明', reading: 'あか' },
        { text: 'るい' },
        { text: '声', reading: 'こえ' },
        { text: 'で' },
        { text: '挨拶', reading: 'あいさつ' },
        { text: 'します。' },
      ],
      plain: '彼女はいつも明るい声で挨拶します。',
      romaji: 'Kanojo wa itsumo akarui koe de aisatsu shimasu.',
      english: 'She always greets everyone in a cheerful, bright voice.',
    },
  ],
  'kanji-kataru': [
    {
      segments: [
        { text: '外国語', reading: 'がいこくご' },
        { text: 'を' },
        { text: '学', reading: 'まな' },
        { text: 'ぶと、' },
        { text: '世界', reading: 'せかい' },
        { text: 'の' },
        { text: '見方', reading: 'みかた' },
        { text: 'が' },
        { text: '広', reading: 'ひろ' },
        { text: 'がる。' },
      ],
      plain: '外国語を学ぶと、世界の見方が広がる。',
      romaji: 'Gaikokugo o manabu to, sekai no mikata ga hirogaru.',
      english: 'Learning a foreign language broadens your perspective on the world.',
    },
    {
      segments: [
        { text: '祖父', reading: 'そふ' },
        { text: 'は' },
        { text: '昔', reading: 'むかし' },
        { text: 'の' },
        { text: '物語', reading: 'ものがたり' },
        { text: 'を' },
        { text: '静', reading: 'しず' },
        { text: 'かに' },
        { text: '語', reading: 'かた' },
        { text: 'ってくれた。' },
      ],
      plain: '祖父は昔の物語を静かに語ってくれた。',
      romaji: 'Sofu wa mukashi no monogatari o shizuka ni katatte kureta.',
      english: 'My grandfather quietly told me stories from long ago.',
    },
  ],
  'kanji-kibou': [
    {
      segments: [
        { text: '展望台', reading: 'てんぼうだい' },
        { text: 'から' },
        { text: '東京', reading: 'とうきょう' },
        { text: 'の' },
        { text: '夜景', reading: 'やけい' },
        { text: 'を' },
        { text: '眺', reading: 'なが' },
        { text: 'めた。' },
      ],
      plain: '展望台から東京の夜景を眺めた。',
      romaji: 'Tenboudai kara Toukyou no yakei o nagameta.',
      english: 'I gazed at the Tokyo night skyline from the observation deck.',
    },
    {
      segments: [
        { text: 'みんなが' },
        { text: '平和', reading: 'へいわ' },
        { text: 'な' },
        { text: '将来', reading: 'しょうらい' },
        { text: 'を' },
        { text: '望', reading: 'のぞ' },
        { text: 'んでいる。' },
      ],
      plain: 'みんなが平和な将来を望んでいる。',
      romaji: 'Minna ga heiwa na shourai o nozonde iru.',
      english: 'Everyone hopes for a peaceful future.',
    },
  ],
  'kanji-shouchou': [
    {
      segments: [
        { text: '失敗', reading: 'しっぱい' },
        { text: 'を' },
        { text: '恐', reading: 'おそ' },
        { text: 'れず、' },
        { text: '新', reading: 'あたら' },
        { text: 'しい' },
        { text: '課題', reading: 'かだい' },
        { text: 'に' },
        { text: '挑', reading: 'いど' },
        { text: 'む' },
        { text: '姿勢', reading: 'しせい' },
        { text: 'が' },
        { text: '大切', reading: 'たいせつ' },
        { text: 'だ。' },
      ],
      plain: '失敗を恐れず、新しい課題に挑む姿勢が大切だ。',
      romaji: 'Shippai o osorezu, atarashii kadai ni idomu shisei ga taisetsu da.',
      english: 'Having the attitude to tackle new challenges without fearing failure is essential.',
    },
    {
      segments: [
        { text: '彼', reading: 'かれ' },
        { text: 'は' },
        { text: '専門', reading: 'せんもん' },
        { text: '分野', reading: 'ぶんや' },
        { text: 'の' },
        { text: '難関', reading: 'なんかん' },
        { text: '資格', reading: 'しかく' },
        { text: 'への' },
        { text: '挑戦', reading: 'ちょうせん' },
        { text: 'を' },
        { text: '決意', reading: 'けつい' },
        { text: 'した。' },
      ],
      plain: '彼は専門分野の難関資格への挑戦を決意した。',
      romaji: 'Kare wa senmon bunya no nankan shikaku e no chousen o ketsui shita.',
      english: 'He resolved to take on the difficult certification in his specialty field.',
    },
  ],
  'kanji-kiwameru': [
    {
      segments: [
        { text: '積極的', reading: 'せっきょくてき' },
        { text: 'に' },
        { text: '議論', reading: 'ぎろん' },
        { text: 'へ' },
        { text: '参加', reading: 'さんか' },
        { text: 'することで、' },
        { text: '理解', reading: 'りかい' },
        { text: 'が' },
        { text: '深', reading: 'ふか' },
        { text: 'まる。' },
      ],
      plain: '積極的に議論へ参加することで、理解が深まる。',
      romaji: 'Sekkyokuteki ni giron e sanka suru koto de, rikai ga fukamaru.',
      english: 'Participating proactively in discussions deepens understanding.',
    },
    {
      segments: [
        { text: '今回', reading: 'こんかい' },
        { text: 'の' },
        { text: '調査', reading: 'ちょうさ' },
        { text: '結果', reading: 'けっか' },
        { text: 'は' },
        { text: '極', reading: 'きわ' },
        { text: 'めて' },
        { text: '重要', reading: 'じゅうよう' },
        { text: 'な' },
        { text: '意味', reading: 'いみ' },
        { text: 'を' },
        { text: '持', reading: 'も' },
        { text: 'つ。' },
      ],
      plain: '今回の調査結果は極めて重要な意味を持つ。',
      romaji: 'Konkai no chousa kekka wa kiwamete juuyou na imi o motsu.',
      english: 'The findings of this survey carry extremely important significance.',
    },
  ],
  'kanji-kan': [
    {
      segments: [
        { text: '過去', reading: 'かこ' },
        { text: 'の' },
        { text: '事例', reading: 'じれい' },
        { text: 'に' },
        { text: '鑑', reading: 'かんが' },
        { text: 'みて、' },
        { text: '方針', reading: 'ほうしん' },
        { text: 'を' },
        { text: '抜本的', reading: 'ばっぽんてき' },
        { text: 'に' },
        { text: '見直', reading: 'みなお' },
        { text: 'した。' },
      ],
      plain: '過去の事例に鑑みて、方針を抜本的に見直した。',
      romaji: 'Kako no jirei ni kangamite, houshin o bapponteki ni minaoshita.',
      english: 'In light of past cases, we fundamentally revised the policy.',
    },
    {
      segments: [
        { text: '専門家', reading: 'せんもんか' },
        { text: 'による' },
        { text: '厳密', reading: 'げんみつ' },
        { text: 'な' },
        { text: '鑑定', reading: 'かんてい' },
        { text: 'を' },
        { text: '経', reading: 'へ' },
        { text: 'て、' },
        { text: '真作', reading: 'しんさく' },
        { text: 'と' },
        { text: '判明', reading: 'はんめい' },
        { text: 'した。' },
      ],
      plain: '専門家による厳密な鑑定を経て、真作と判明した。',
      romaji: 'Senmonka ni yoru genmitsu na kantei o hete, shinsaku to hanmei shita.',
      english: 'Following rigorous appraisal by experts, it was confirmed to be authentic.',
    },
  ],
  'kanji-yuugen': [
    {
      segments: [
        { text: '能楽', reading: 'のうがく' },
        { text: 'の' },
        { text: '舞台', reading: 'ぶたい' },
        { text: 'には、' },
        { text: '言葉', reading: 'ことば' },
        { text: 'を' },
        { text: '超', reading: 'こ' },
        { text: 'えた' },
        { text: '幽玄', reading: 'ゆうげん' },
        { text: 'の' },
        { text: '美意識', reading: 'びいしき' },
        { text: 'が' },
        { text: '宿', reading: 'やど' },
        { text: 'る。' },
      ],
      plain: '能楽の舞台には、言葉を超えた幽玄の美意識が宿る。',
      romaji: 'Nougaku no butai ni wa, kotoba o koeta yuugen no biishiki ga yadoru.',
      english: 'A subtle, profound aesthetic beyond words dwells on the Noh theater stage.',
    },
    {
      segments: [
        { text: '深山', reading: 'しんざん' },
        { text: 'の' },
        { text: '幽谷', reading: 'ゆうこく' },
        { text: 'に' },
        { text: '響', reading: 'ひび' },
        { text: 'く' },
        { text: '清流', reading: 'せいりゅう' },
        { text: 'の' },
        { text: '音', reading: 'おと' },
        { text: 'が' },
        { text: '心', reading: 'こころ' },
        { text: 'を' },
        { text: '澄', reading: 'す' },
        { text: 'ませる。' },
      ],
      plain: '深山の幽谷に響く清流の音が心を澄ませる。',
      romaji: 'Shinzan no yuukoku ni hibiku seiryuu no oto ga kokoro o sumaseru.',
      english: 'The sound of a clear stream echoing through a secluded mountain valley calms the mind.',
    },
  ],
};

/**
 * Returns 3 JLPT-level-appropriate example sentences for any SRS Kanji card,
 * each with Furigana segments, plain Japanese text, Romaji, and natural English meaning.
 */
export function getKanjiExampleSentences(card: KanjiCard): KanjiExampleSentence[] {
  const primary: KanjiExampleSentence = {
    id: `${card.id}-ex-1`,
    level: card.level,
    segments: card.exampleSentence.segments,
    plain: card.exampleSentence.plain,
    romaji: card.exampleSentence.romaji,
    english: card.exampleSentence.english,
  };

  const extras = (EXTRA_KANJI_SENTENCES[card.id] ?? []).map((item, idx) => ({
    id: `${card.id}-ex-${idx + 2}`,
    level: card.level,
    ...item,
  }));

  return [primary, ...extras].slice(0, 3);
}
