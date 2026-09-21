import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from '@/app/pages/NotFound';

describe('NotFound', () => {
    it('renders the 404 message and links', () => {
        render(
            <MemoryRouter
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}>
                <NotFound />
            </MemoryRouter>
        );

        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText(/this page wandered off/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
    });
});
