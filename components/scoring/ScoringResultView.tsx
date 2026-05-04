"use client";

interface CriterionResult {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface ScoringResultData {
  score: number | null;
  maxScore: number | null;
  rubricBreakdown: CriterionResult[] | unknown;
  feedback: {
    summary?: string;
    suggestions?: string[];
  } | unknown;
}

interface ScoringResultViewProps {
  result: ScoringResultData;
  showDetails?: boolean;
}

function isCriterionResult(
  criteria: unknown
): criteria is CriterionResult[] {
  return Array.isArray(criteria);
}

function isFeedbackObject(
  feedback: unknown
): feedback is { summary?: string; suggestions?: string[] } {
  return typeof feedback === "object" && feedback !== null;
}

export function ScoringResultView({ result, showDetails = true }: ScoringResultViewProps) {
  const { score, maxScore, rubricBreakdown, feedback } = result;
  const criteria = isCriterionResult(rubricBreakdown) ? rubricBreakdown : [];
  const feedbackObj = isFeedbackObject(feedback) ? feedback : {};
  const summary = feedbackObj.summary;
  const suggestions = feedbackObj.suggestions;

  if (score === null || maxScore === null) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-semibold text-amber-800">Scoring in Progress</h3>
        <p className="mt-1 text-sm text-amber-700">
          Your answer is being evaluated. Please check back in a moment.
        </p>
      </div>
    );
  }

  const percentage = Math.round((score / maxScore) * 100);
  const scoreClass = percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Score</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${scoreClass}`}>
            {score}
          </span>
          <span className="text-2xl text-gray-500">/ {maxScore}</span>
          <span className={`ml-2 text-lg font-medium ${scoreClass}`}>
            ({percentage}%)
          </span>
        </div>

        {summary && (
          <p className="mt-4 text-gray-700">{summary}</p>
        )}
      </div>

      {showDetails && criteria.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Criteria Breakdown</h3>
          <div className="mt-4 space-y-4">
            {criteria.map((criterion, index) => {
              const criterionPercentage = Math.round(
                (criterion.score / criterion.maxScore) * 100
              );
              return (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{criterion.name}</span>
                    <span className="text-gray-600">
                      {criterion.score} / {criterion.maxScore}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${criterionPercentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{criterion.feedback}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showDetails && suggestions && suggestions.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">Suggestions for Improvement</h3>
          <ul className="mt-3 list-inside list-disc space-y-1 text-blue-800">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}