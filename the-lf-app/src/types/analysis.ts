export type AnalysisPhase = {
  name: string;
  timestamp_start: string;
  timestamp_end: string;
  algorithm_identified: string | null;
  observations: string;
  recommendation: string;
};

export type AnalysisReport = {
  overall_summary: string;
  estimated_total_time: string;
  top_priorities: string[];
  phases: AnalysisPhase[];
  recommended_lesson_ids: string[];
};
