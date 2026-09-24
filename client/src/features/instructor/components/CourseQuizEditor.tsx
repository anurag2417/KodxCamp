import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { instructorApi, type ApiInstructorQuizQuestion } from '@/features/instructor/api';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card } from '@/shared/components/ui/Card';

interface Props {
  courseSlug: string;
}

const emptyOptions = [
  { id: 'a', text: '' },
  { id: 'b', text: '' },
  { id: 'c', text: '' },
  { id: 'd', text: '' },
];

export const CourseQuizEditor: React.FC<Props> = ({ courseSlug }) => {
  const [questions, setQuestions] = useState<ApiInstructorQuizQuestion[]>([]);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(emptyOptions);
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [correctOptionIds, setCorrectOptionIds] = useState(['a']);
  const [explanation, setExplanation] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => instructorApi.listQuiz(courseSlug).then(setQuestions).catch(() => setQuestions([]));
  useEffect(() => {
    void load();
  }, [courseSlug]);

  const create = async () => {
    if (!prompt.trim() || options.some((option) => !option.text.trim())) return;
    setBusy(true);
    try {
      await instructorApi.createQuizQuestion(courseSlug, {
        prompt,
        options,
        mode,
        correctOptionIds,
        explanation,
        order: questions.length + 1,
      });
      setPrompt('');
      setOptions(emptyOptions);
      setMode('single');
      setCorrectOptionIds(['a']);
      setExplanation('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await instructorApi.deleteQuizQuestion(courseSlug, id);
    setQuestions((current) => current.filter((question) => question._id !== id));
  };

  return (
    <Card className="mt-8 p-6">
      <h2 className="text-lg font-semibold text-text-primary">Course quiz</h2>
      <p className="mt-1 text-sm text-text-muted">Add multiple-choice questions for enrolled learners.</p>
      <div className="mt-4 flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Question"
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
        />
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <input
              type={mode === 'multiple' ? 'checkbox' : 'radio'}
              checked={correctOptionIds.includes(option.id)}
              onChange={() => setCorrectOptionIds((current) => {
                if (mode === 'single') return [option.id];
                return current.includes(option.id)
                  ? current.filter((id) => id !== option.id)
                  : [...current, option.id];
              })}
              aria-label={`Correct option ${index + 1}`}
            />
            <Input
              value={option.text}
              placeholder={`Option ${index + 1}`}
              onChange={(event) => setOptions((current) => current.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item))}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  setOptions((current) => current.filter((item) => item.id !== option.id));
                  setCorrectOptionIds((current) => current.filter((id) => id !== option.id));
                }}
                className="rounded p-1 text-text-muted hover:bg-surface-tertiary hover:text-[var(--color-error)]"
                title="Remove option"
                aria-label="Remove option"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOptions((current) => [...current, { id: String.fromCharCode(97 + current.length), text: '' }])}
            disabled={options.length >= 6}
          >
            <Plus size={14} /> Add option
          </Button>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            Answer mode
            <select value={mode} onChange={(event) => { const next = event.target.value as 'single' | 'multiple'; setMode(next); if (next === 'single') setCorrectOptionIds((current) => current.slice(0, 1)); }} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text-primary">
              <option value="single">Single correct</option>
              <option value="multiple">Multiple correct</option>
            </select>
          </label>
        </div>
        <Input value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Explanation shown after submission (optional)" />
        <Button className="self-start" onClick={create} disabled={busy || !prompt.trim() || !correctOptionIds.length || options.some((option) => !option.text.trim())}>
          <Plus size={14} /> {busy ? 'Adding...' : 'Add question'}
        </Button>
      </div>
      {questions.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {questions.map((question, index) => (
            <div key={question._id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <p className="text-sm text-text-primary">{index + 1}. {question.prompt}</p>
              <button type="button" onClick={() => void remove(question._id)} className="rounded p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10" title="Delete question" aria-label="Delete question">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
