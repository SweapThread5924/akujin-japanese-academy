export interface DailyQuote {
  id: string;
  quote: string;
  author: string;
  role: string;
  japaneseProverb?: string;
  japaneseProverbReading?: string;
  japaneseProverbMeaning?: string;
  encouragement: string;
}

export const INSPIRING_QUOTES: DailyQuote[] = [
  {
    id: 'q-01',
    quote: 'Continuity is power — small calm efforts stacked every single day move mountains.',
    author: 'Keizoku wa Chikara Nari',
    role: 'Japanese Proverb',
    japaneseProverb: '継続は力なり',
    japaneseProverbReading: 'けいぞくはちからなり',
    japaneseProverbMeaning: 'Perseverance is strength.',
    encouragement: 'Just ten calm minutes today keeps your Japanese momentum alive without stress.',
  },
  {
    id: 'q-02',
    quote: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    role: 'Philosopher',
    japaneseProverb: '石の上にも三年',
    japaneseProverbReading: 'いしのうえにもさんねん',
    japaneseProverbMeaning: 'Even on a cold stone, sit for three years and patience turns it warm.',
    encouragement: 'Trust slow repetition—your brain connects kana and kanji even while resting.',
  },
  {
    id: 'q-03',
    quote: 'Fall down seven times, stand up eight.',
    author: 'Nanakorobi Yaoki',
    role: 'Japanese Proverb',
    japaneseProverb: '七転び八起き',
    japaneseProverbReading: 'ななころびやおき',
    japaneseProverbMeaning: 'Never stay down after a mistake.',
    encouragement: 'Missing a kanji or particle is part of building memory, never failure.',
  },
  {
    id: 'q-04',
    quote: 'There is nothing outside of yourself that can ever enable you to get better, stronger, or wiser. Everything is within.',
    author: 'Miyamoto Musashi',
    role: 'Swordsman & Philosopher (The Book of Five Rings)',
    japaneseProverb: '千日の稽古を鍛とし、万日の稽古を練とす',
    japaneseProverbReading: 'せんにちのけいこをたんとし',
    japaneseProverbMeaning: 'A thousand days of discipline to forge, ten thousand days to refine.',
    encouragement: 'Treat each drill as quiet daily polish rather than an exam race.',
  },
  {
    id: 'q-05',
    quote: 'Hard work compounds quietly until fluency feels effortless.',
    author: 'Kazuo Inamori',
    role: 'Founder of Kyocera',
    japaneseProverb: '一日一歩',
    japaneseProverbReading: 'いちにちいっぽ',
    japaneseProverbMeaning: 'One step every single day.',
    encouragement: 'Complete one focused lesson today and close the day proud.',
  },
  {
    id: 'q-06',
    quote: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
    role: 'Author',
    japaneseProverb: '塵も積もれば山となる',
    japaneseProverbReading: 'ちりもつもればやまとなる',
    japaneseProverbMeaning: 'Even dust, when piled high, becomes a mountain.',
    encouragement: 'Five new words a day builds over 1,800 words in a single calm year.',
  },
  {
    id: 'q-07',
    quote: 'Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.',
    author: 'Marie Curie',
    role: 'Two-Time Nobel Laureate',
    encouragement: 'Kanji looks complex at first glance, until one radical unlocks dozens of characters.',
  },
  {
    id: 'q-08',
    quote: 'I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.',
    author: 'Bruce Lee',
    role: 'Martial Artist & Thinker',
    encouragement: 'Replaying core audio and tracing high-frequency kana beats rushing through chapters.',
  },
  {
    id: 'q-09',
    quote: 'A journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    role: 'Philosopher',
    japaneseProverb: '千里の道も一歩から',
    japaneseProverbReading: 'せんりのみちもいっぽから',
    japaneseProverbMeaning: 'Even a thousand-ri journey starts from one step.',
    encouragement: 'Start where you stand today—whether with あ or JLPT N1 essays.',
  },
  {
    id: 'q-10',
    quote: 'It always seems impossible until it is done.',
    author: 'Nelson Mandela',
    role: 'Statesman & Nobel Laureate',
    encouragement: 'Every fluent speaker once stared at their very first Hiragana chart.',
  },
  {
    id: 'q-11',
    quote: 'Pain is inevitable. Suffering is optional. Show up steadily and let time work for you.',
    author: 'Haruki Murakami',
    role: 'Japanese Novelist',
    encouragement: 'Keep study joyful and unhurried—consistency always outpaces cramming.',
  },
  {
    id: 'q-12',
    quote: 'Genius is 1% inspiration and 99% perspiration.',
    author: 'Thomas A. Edison',
    role: 'Inventor',
    encouragement: 'Spaced repetition turns steady daily effort into permanent recall.',
  },
  {
    id: 'q-13',
    quote: 'Little by little, one travels far.',
    author: 'J.R.R. Tolkien',
    role: 'Philologist & Author',
    encouragement: 'Short relaxed sessions beat marathon burnout every single week.',
  },
  {
    id: 'q-14',
    quote: 'Focus on the step in front of you, not the whole staircase.',
    author: 'Dr. Martin Luther King Jr.',
    role: 'Civil Rights Leader',
    encouragement: 'Master today’s five phrases and trust the roadmap ahead.',
  },
  {
    id: 'q-15',
    quote: 'Luck is what happens when preparation meets opportunity.',
    author: 'Seneca',
    role: 'Stoic Philosopher',
    encouragement: 'Every listening drill today prepares you for real conversations in Tokyo.',
  },
  {
    id: 'q-16',
    quote: 'You may not control all the events that happen to you, but you can decide not to be reduced by them.',
    author: 'Maya Angelou',
    role: 'Poet & Author',
    encouragement: 'Breathe through tricky grammar—clarity arrives on the second or third read.',
  },
  {
    id: 'q-17',
    quote: 'Discipline is remembering what you want most over what is easy right now.',
    author: 'Ichiro Suzuki',
    role: 'Japanese Baseball Legend',
    japaneseProverb: '小さなことを積み重ねることが、とんでもないところへ行くただ一つの道',
    japaneseProverbReading: 'ちいさなことをつみかさねることが',
    japaneseProverbMeaning: 'Accumulating small things is the only path to extraordinary places.',
    encouragement: 'One quiet review round today takes you closer to your dream in Japan.',
  },
  {
    id: 'q-18',
    quote: 'Stay hungry, stay foolish, and keep building brick by brick.',
    author: 'Steve Jobs',
    role: 'Co-founder of Apple',
    encouragement: 'Curiosity turns grammar rules into living stories you actually enjoy.',
  },
  {
    id: 'q-19',
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle (Will Durant)',
    role: 'Philosophical Tradition',
    encouragement: 'Make Japanese part of your morning tea or evening wind-down.',
  },
  {
    id: 'q-20',
    quote: 'Patience and perseverance have a magical effect before which difficulties disappear.',
    author: 'John Quincy Adams',
    role: 'Statesman',
    encouragement: 'Particles like は, が, and に settle naturally after hearing real dialogues.',
  },
  {
    id: 'q-21',
    quote: 'Do what you can, with what you have, where you are.',
    author: 'Theodore Roosevelt',
    role: 'Statesman',
    encouragement: 'Even 5 calm minutes on mobile preserves your clarity and confidence.',
  },
  {
    id: 'q-22',
    quote: 'Learning never exhausts the mind when curiosity leads the way.',
    author: 'Leonardo da Vinci',
    role: 'Polymath & Artist',
    encouragement: 'Explore a favorite Tokyo scenario or YouTube lecture when textbooks feel heavy.',
  },
  {
    id: 'q-23',
    quote: 'When you feel like quitting, remember why you started this journey.',
    author: 'Japanese Study Wisdom',
    role: 'AkuJin Daily Note',
    japaneseProverb: '初心忘るべからず',
    japaneseProverbReading: 'しょしんわするべからず',
    japaneseProverbMeaning: 'Never forget your beginner’s spirit and purpose.',
    encouragement: 'Keep your goal in Japan bright and let stress fall away.',
  },
  {
    id: 'q-24',
    quote: 'The best time to plant a tree was twenty years ago. The second best time is today.',
    author: 'Traditional Proverb',
    role: 'Timeless Wisdom',
    encouragement: 'Every review you finish today plants confidence for next season.',
  },
  {
    id: 'q-25',
    quote: 'Effort never betrays you when paired with patience and calm focus.',
    author: 'Mao Asada',
    role: 'Japanese World Champion Skater',
    encouragement: 'Gentle repetition beats rushed perfection every single day.',
  },
  {
    id: 'q-26',
    quote: 'He who moves a mountain begins by carrying away small stones.',
    author: 'Confucius',
    role: 'Philosopher',
    encouragement: 'Tackle ten kanji today—the full 2,136 Jōyō list shrinks faster than you expect.',
  },
  {
    id: 'q-27',
    quote: 'Don’t watch the clock; do what it does. Keep going calmly.',
    author: 'Sam Levenson',
    role: 'Author & Humorist',
    encouragement: 'Progress happens in quiet minutes between your daily commitments.',
  },
  {
    id: 'q-28',
    quote: 'If you hear a voice within you say you cannot speak, speak anyway and the skill grows.',
    author: 'Vincent van Gogh (Adapted)',
    role: 'Artist',
    encouragement: 'Shadowing a single native sentence aloud trains mouth, ear, and confidence together.',
  },
  {
    id: 'q-29',
    quote: 'Strength does not come from winning once; it comes from steady struggles that shape resilience.',
    author: 'Mahatma Gandhi',
    role: 'Leader & Thinker',
    encouragement: 'Stay steady, forgive rusty days, and begin gently again.',
  },
  {
    id: 'q-30',
    quote: 'To learn a new language is to gain a second soul and see the world anew.',
    author: 'Charlemagne',
    role: 'Historical Maxim',
    encouragement: 'Enjoy each cultural nuance you unlock from Kansai banter to polite Keigo.',
  },
  {
    id: 'q-31',
    quote: 'One kind word can warm three winter months — and one learned phrase opens a whole new city.',
    author: 'Japanese Proverb',
    role: 'Kotowaza Tradition',
    japaneseProverb: '一言芳恩',
    japaneseProverbReading: 'いちごんほうおん',
    japaneseProverbMeaning: 'Deep gratitude for even a single warm word.',
    encouragement: 'Celebrate every small milestone along your path from Zero to N1.',
  },
];

export function formatLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayIndexForDate(date = new Date()): number {
  const localMidnightUtcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(localMidnightUtcMs / 86_400_000);
}

export function getQuoteOfTheDay(date = new Date()): DailyQuote & { dateKey: string } {
  const dayIndex = Math.abs(getDayIndexForDate(date));
  const picked = INSPIRING_QUOTES[dayIndex % INSPIRING_QUOTES.length];
  return {
    ...picked,
    dateKey: formatLocalDateKey(date),
  };
}
