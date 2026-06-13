import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn function', () => {
    it('merges multiple class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles conditional classes with clsx syntax', () => {
      const condition = true;
      const result = cn('base', condition && 'conditional');
      expect(result).toBe('base conditional');
    });

    it('handles conditional classes that are false', () => {
      const condition = false;
      const result = cn('base', condition && 'conditional');
      expect(result).toBe('base');
    });

    it('ignores falsy values', () => {
      const result = cn('class1', false, null, undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('merges conflicting Tailwind classes', () => {
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });

    it('handles multiple conflicting Tailwind utilities', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('handles array inputs', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('handles object inputs', () => {
      const result = cn({ 'class1': true, 'class2': false });
      expect(result).toBe('class1');
    });

    it('returns empty string with empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('returns empty string with only falsy values', () => {
      const result = cn(false, null, undefined);
      expect(result).toBe('');
    });

    it('normalizes whitespace', () => {
      const result = cn('  class1  ', 'class2  ');
      expect(result).toBe('class1 class2');
    });

    it('handles complex scenarios with mixed input types', () => {
      const condition = true;
      const result = cn(
        'base',
        ['array-class'],
        { 'obj-class': true, 'hidden': false },
        condition && 'conditional',
        'px-2 px-4'
      );
      expect(result).toContain('base');
      expect(result).toContain('array-class');
      expect(result).toContain('obj-class');
      expect(result).toContain('conditional');
      expect(result).toContain('px-4');
      expect(result).not.toContain('hidden');
    });
  });
});
