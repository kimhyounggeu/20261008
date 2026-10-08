// 브라우저와 서버가 함께 쓰는 데이터 형태

export interface Criterion {
  id: string;
  name: string;
  /** 무엇을 보고 평가할지, 수준별 기술 등 */
  description: string;
  maxScore: number;
}

export interface Rubric {
  id: string;
  title: string;
  /** 활동지 과제 설명·학년·교과 등 AI가 참고할 맥락 */
  description: string;
  criteria: Criterion[];
  createdAt: string;
  updatedAt: string;
}

export type RubricInput = Pick<Rubric, "title" | "description" | "criteria">;

export interface CriterionResult {
  criterionId: string;
  name: string;
  score: number;
  maxScore: number;
  rationale: string;
  suggestions: string;
}

export type EvaluationStatus = "processing" | "done" | "error";

export interface Evaluation {
  id: string;
  rubricId: string;
  /** 평가 당시 기준을 그대로 보관해, 기준을 나중에 고쳐도 결과 해석이 흔들리지 않게 한다 */
  rubricSnapshot: RubricInput;
  studentName: string;
  fileName: string;
  fileSize: number;
  status: EvaluationStatus;
  results: CriterionResult[];
  overallFeedback: string;
  totalScore: number;
  maxTotal: number;
  model: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
