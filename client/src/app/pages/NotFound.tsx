import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Seo } from '@/shared/components/seo/Seo';

export const NotFound: React.FC = () => (
  <>
    <Seo
      title="Page not found"
      description="The page you're looking for doesn't exist."
    />
    <div className="grid min-h-[70vh] w-full place-items-center p-6">
      <div className="text-center">
        <p className="text-8xl font-bold tracking-tight text-brand-500">404</p>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          This page wandered off
        </h1>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          The page you're looking for doesn't exist — maybe it was moved, or the
          link is broken.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button size="lg">Go home</Button>
          </Link>
          <Link to="/courses">
            <Button size="lg" variant="secondary">
              Browse courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </>
);
