"use client";

import { useState } from "react";

interface Criterion {
  name: string;
  maxScore: number;
  description: string;
}

interface RubricEditorProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    questionType?: string;
    maxScore: number;
    criteria: Criterion[];
  };
  onSubmit: (data: {
    title: string;
    description?: string;
    questionType?: string;
    maxScore: number;
    criteria: Criterion[];
  }) => Promise<void>;
  onCancel?: () => void;
}

export function RubricEditor({ initialData, onSubmit, onCancel }: RubricEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [questionType, setQuestionType] = useState(initialData?.questionType || "");
  const [maxScore, setMaxScore] = useState(initialData?.maxScore || 100);
  const [criteria, setCriteria] = useState<Criterion[]>(
    initialData?.criteria || [
      { name: "Content", maxScore: 40, description: "" },
      { name: "Organization", maxScore: 20, description: "" },
      { name: "Language", maxScore: 40, description: "" }
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCriteriaScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalCriteriaScore !== maxScore) {
      setError(`Criteria scores must sum to ${maxScore}. Currently: ${totalCriteriaScore}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ title, description: description || undefined, questionType: questionType || undefined, maxScore, criteria });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rubric");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCriterion = () => {
    setCriteria([...criteria, { name: "", maxScore: 10, description: "" }]);
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="TEM-4 Writing Rubric"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Rubric description..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Question Type</label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Any</option>
          <option value="WRITING_SUMMARY">Writing Summary</option>
          <option value="WRITING_PARAGRAPH">Writing Paragraph</option>
          <option value="WRITING_OUTLINE">Writing Outline</option>
          <option value="WRITING_FRAMEWORK">Writing Framework</option>
          <option value="WRITING_FULL_MOCK">Writing Full Mock</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Max Score</label>
        <input
          type="number"
          value={maxScore}
          onChange={(e) => setMaxScore(Number(e.target.value))}
          min={1}
          required
          className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Criteria</label>
        <p className="mt-1 text-sm text-gray-500">
          Total: {totalCriteriaScore} / {maxScore}
          {totalCriteriaScore !== maxScore && (
            <span className="ml-2 text-red-500">(must equal max score)</span>
          )}
        </p>

        <div className="mt-3 space-y-3">
          {criteria.map((criterion, index) => (
            <div key={index} className="flex gap-3 rounded-md border border-gray-200 p-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={criterion.name}
                  onChange={(e) => updateCriterion(index, "name", e.target.value)}
                  placeholder="Criterion name"
                  required
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  value={criterion.maxScore}
                  onChange={(e) => updateCriterion(index, "maxScore", Number(e.target.value))}
                  min={1}
                  required
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={criterion.description}
                  onChange={(e) => updateCriterion(index, "description", e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeCriterion(index)}
                disabled={criteria.length <= 1}
                className="text-red-500 hover:text-red-700 disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCriterion}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add criterion
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || totalCriteriaScore !== maxScore}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Rubric"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}