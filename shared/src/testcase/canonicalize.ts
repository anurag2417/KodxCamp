import type { CanonicalizationId } from '../types/problem';

export function canonicalize(
  output: string,
  id: CanonicalizationId = 'trim-trailing-newline'
): string {
  switch (id) {
    case 'trim-trailing-newline':
      return output
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n$/, '');

    case 'trim-all':
      return output.replace(/\r\n/g, '\n').trim();

    case 'exact':
      return output;
  }
}