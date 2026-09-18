import Editor from '@monaco-editor/react';
import { useThemeStore } from '../../store/theme.store';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
  height = '100%',
}) => {
  const theme = useThemeStore((s) => s.theme);

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onChange={(val) => onChange?.(val ?? '')}
      options={{
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
};