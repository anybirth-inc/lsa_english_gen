interface Sentence {
  japanese: string;
  english: string;
  category: string;
  pronoun: "I" | "HE/SHE" | "IT" | "WE" | "THEY";
  level: 1 | 2 | 3;
}

export const sentences: Sentence[] = [
  { japanese: "彼女は空き時間にガーデニングを楽しんでいます。", english: "She enjoys gardening in her free time.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は海に行くことが大好きです。", english: "She loves to go to the beach.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は風景画を描くことが大好きです。", english: "She loves to paint landscapes.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は毎朝ヨガを練習します。", english: "She practices yoga every morning.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は歌うことが大好きです。", english: "She loves to sing.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は試験のために一生懸命勉強します。", english: "She studies hard for her exams.", category: "学校", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼女は動物保護施設でボランティア活動をしています。", english: "She volunteers at the animal shelter.", category: "趣味", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼女は地元の図書館でボランティア活動をしています。", english: "She volunteers at the local library.", category: "趣味", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼女は客室乗務員として働いています。", english: "She works as a flight attendant.", category: "仕事", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼女は看護師として働いています。", english: "She works as a nurse.", category: "仕事", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼女は空き時間に詩を書きます。", english: "She writes poetry in her free time.", category: "趣味", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼は仕事で建物の設計をしています。", english: "He designs buildings for a living.", category: "仕事", pronoun: "HE/SHE", level: 3 },
  { japanese: "彼は毎晩寝る前に本を読みます。", english: "He reads a book every night before bed.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼はジャーナリストとして働いています。", english: "He works as a journalist.", category: "仕事", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼女は毎年新しい言語を学びます。", english: "She learns a new language every year.", category: "学校", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼は朝にお茶をたくさん飲みます。", english: "He drinks tea a lot in the morning.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼は週末に釣りを楽しんでいます。", english: "He enjoys fishing on the weekends.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼は山登りを楽しんでいます。", english: "He enjoys hiking in the mountains.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼は幼少期からクラシック音楽を聴いています。", english: "He listens to classical music from his childhood.", category: "趣味", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼はイタリア料理を子供たちのために作るのが大好きです。", english: "He loves to cook Italian food for his children.", category: "趣味", pronoun: "HE/SHE", level: 2 },
  { japanese: "彼はリーグでサッカーをします。", english: "He plays soccer in a league.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼はバンドでギターを演奏します。", english: "He plays guitar in a league.", category: "趣味", pronoun: "HE/SHE", level: 1 },
  
  // 生活カテゴリの文章
  { japanese: "彼女は毎朝6時に起きます。", english: "She wakes up at 6 o'clock every morning.", category: "生活", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼は週末に部屋の掃除をします。", english: "He cleans his room on weekends.", category: "生活", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は毎日自転車で通勤します。", english: "She commutes by bicycle every day.", category: "生活", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼は夜9時に寝ます。", english: "He goes to bed at 9 PM.", category: "生活", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は週末に食料品の買い物に行きます。", english: "She goes grocery shopping on weekends.", category: "生活", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼は朝食に和食を食べます。", english: "He eats Japanese food for breakfast.", category: "生活", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼女は電車で通学します。", english: "She takes the train to school.", category: "生活", pronoun: "HE/SHE", level: 1 },
  { japanese: "彼は毎日日記を書きます。", english: "He writes in his diary every day.", category: "生活", pronoun: "HE/SHE", level: 1 },

  // 新しい代名詞の例文
  { japanese: "私は毎日ジョギングをします。", english: "I go jogging every day.", category: "趣味", pronoun: "I", level: 1 },
  { japanese: "私たちは週末にテニスをします。", english: "We play tennis on weekends.", category: "趣味", pronoun: "WE", level: 1 },
  { japanese: "彼らは一緒に映画を見ます。", english: "They watch movies together.", category: "趣味", pronoun: "THEY", level: 1 },
  { japanese: "それは壊れています。", english: "It is broken.", category: "生活", pronoun: "IT", level: 1 }
];