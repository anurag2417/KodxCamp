import { useEffect, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { coursesApi, type ApiQuizQuestion, type ApiQuizResult } from '@/features/courses/api';
import { useAuthStore } from '@/shared/store/auth.store';

interface Props {
  courseSlug: string;
}

export const CourseQuiz: React.FC<Props> = ({ courseSlug }) => {
  const user = useAuthStore((state) => state.user);
  const [questions, setQuestions] = useState<ApiQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ApiQuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    coursesApi
      .getQuiz(courseSlug)
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [courseSlug, user]);

  if (!user || loading || questions.length === 0) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      setResult(await coursesApi.submitQuiz(courseSlug, answers));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-8 border-t border-border pt-8">
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-brand-500" />
        <h2 className="text-lg font-semibold text-text-primary">Course quiz</h2>
      </div>
      <div className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <fieldset key={question._id} className="rounded-xl border border-border bg-surface p-4">
            <legend className="px-1 text-sm font-semibold text-text-primary">
              {index + 1}. {question.prompt}
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              {question.options.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary">
                  <input
                    type={question.mode === 'multiple' ? 'checkbox' : 'radio'}
                    value={option.id}
                    checked={answers[question._id]?.includes(option.id) ?? false}
                    onChange={() => setAnswers((current) => {
                      const selected = current[question._id] ?? [];
                      const next = selected.includes(option.id)
                        ? selected.filter((id) => id !== option.id)
                        : question.mode === 'single'
                          ? [option.id]
                          : [...selected, option.id];
                      return { ...current, [question._id]: next };
                    })}
                  />
                  {option.text}
                </label>
              ))}
            </div>
            {result && (
              <p className={`mt-3 text-xs ${result.results[index]?.correct ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                {result.results[index]?.correct ? 'Correct' : `Review: ${result.results[index]?.explanation || 'Try this question again.'}`}
              </p>
            )}
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={submitting || Object.keys(answers).length !== questions.length}>
          <Send size={14} /> {submitting ? 'Checking...' : 'Submit quiz'}
        </Button>
        {result && <span className="text-sm font-semibold text-text-secondary">Score: {result.score}/{result.total} ({result.percentage}%)</span>}
      </div>
    </section>
  );
};
