export interface Sentence {
  english: string;
  japanese: string;
  level: number;
  present_type: string;
  contents_type: string;
  id: number;
}

export interface GeneratedSentence {
  english: string;
  japanese: string;
  level: number;
  present_type: string;
  contents_type: string;
  id: string;
  selected: boolean;
}

export type FilterType = 'category' | 'pronoun' | 'level';