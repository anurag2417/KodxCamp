import { useInView } from '../hooks/useInView';
import { cn } from '../../../shared/lib/utils';

interface Props {
  children: string;
  /** Custom class for the outer wrapper */
  className?: string;
  /** Delay between each word, in ms */
  stagger?: number;
  /** Starting offset before animation kicks in, in ms */
  delay?: number;
  /** Render the outer element as this tag */
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export const AnimatedText: React.FC<Props> = ({
  children,
  className,
  stagger = 60,
  delay = 0,
  as: Tag = 'h2',
}) => {
  const { ref, inView } = useInView({ rootMargin: '0px 0px -15% 0px' });
  const words = children.split(' ');

  return (
    <Tag ref={ref as never} className={cn('inline-block', className)}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: '0.1em' }}
        >
          <span
            className={cn(
              'inline-block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
              inView ? 'translate-y-0' : 'translate-y-full'
            )}
            style={{
              transitionDelay: `${delay + i * stagger}ms`,
            }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
};