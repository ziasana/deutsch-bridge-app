export interface NomenVerb {
  id: string;
  word: string;
  explanation: string;
  example: string;
  level: string;
  tags: string;
  learningProgresses: LearningProgress[]
}

export  interface  LearningProgress {
  id: string;
  learned: boolean
}

export  interface  LearningProgressRequest {
  nomenVerbId: string;
  learned: boolean
}
