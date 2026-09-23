import { describe, it, expect } from 'vitest';
import { canonicalize } from '../canonicalize';

describe('canonicalize — trim-trailing-newline', () => {
    const mode = 'trim-trailing-newline' as const;

    it('returns the string unchanged when there is nothing to trim', () => {
        expect(canonicalize('hello', mode)).toBe('hello');
    });

    it('strips a single trailing newline', () => {
        expect(canonicalize('hello\n', mode)).toBe('hello');
    });

    it('strips only one trailing newline (idempotency contract)', () => {
        // Two trailing newlines become one.
        expect(canonicalize('hello\n\n', mode)).toBe('hello\n');
    });

    it('normalizes CRLF to LF', () => {
        expect(canonicalize('a\r\nb\r\nc\r\n', mode)).toBe('a\nb\nc');
    });

    it('strips trailing spaces and tabs on each line', () => {
        expect(canonicalize('a  \nb\t\nc', mode)).toBe('a\nb\nc');
    });

    it('does not touch leading whitespace', () => {
        expect(canonicalize('  indented\n', mode)).toBe('  indented');
    });

    it('handles an empty string', () => {
        expect(canonicalize('', mode)).toBe('');
    });

    it('handles a string that is only a newline', () => {
        expect(canonicalize('\n', mode)).toBe('');
    });

    it('preserves internal blank lines', () => {
        expect(canonicalize('a\n\nb\n', mode)).toBe('a\n\nb');
    });

    it('strips exactly one trailing newline per call (not idempotent on multi-newline input)', () => {
        // The rule is: strip exactly one trailing \n. This is deliberate —
        // a program that legitimately prints two blank lines must not have
        // them both collapsed away.
        const input = 'line1  \r\nline2\t\n\n';
        const once = canonicalize(input, mode);
        expect(once).toBe('line1\nline2\n');

        const twice = canonicalize(once, mode);
        expect(twice).toBe('line1\nline2');

        const thrice = canonicalize(twice, mode);
        expect(thrice).toBe('line1\nline2');
    });

    it('is stable on input that already has at most one trailing newline', () => {
        // This is the property hidden-test comparison actually relies on:
        // a value that has been canonicalized once is unchanged by a
        // second pass, provided it started with zero or one trailing newline.
        const inputs = ['hello', 'hello\n', 'a\nb', 'a\nb\n'];
        for (const input of inputs) {
            const once = canonicalize(input, mode);
            const twice = canonicalize(once, mode);
            expect(twice).toBe(once);
        }
    });
});

describe('canonicalize — trim-all', () => {
    const mode = 'trim-all' as const;

    it('trims leading and trailing whitespace', () => {
        expect(canonicalize('  hello  ', mode)).toBe('hello');
    });

    it('normalizes CRLF to LF and trims', () => {
        expect(canonicalize('\r\nhello\r\nworld\r\n', mode)).toBe('hello\nworld');
    });

    it('collapses nothing beyond leading/trailing', () => {
        expect(canonicalize('a  b  c', mode)).toBe('a  b  c');
    });

    it('handles an empty string', () => {
        expect(canonicalize('', mode)).toBe('');
    });
});

describe('canonicalize — exact', () => {
    const mode = 'exact' as const;

    it('returns the string byte-for-byte', () => {
        const input = 'line1  \r\nline2\t\n\n';
        expect(canonicalize(input, mode)).toBe(input);
    });

    it('handles an empty string', () => {
        expect(canonicalize('', mode)).toBe('');
    });
});