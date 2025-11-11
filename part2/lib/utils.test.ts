// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

//
// ZENITH TEST SUITE: UTILITIES
// PRINCIPLE: ZENITH PERFECTION ENFORCEMENT
// COMMANDMENT: TESTING MANDATORY
//
// This test suite validates the core utility functions.
// The `cn` function is critical for conditional styling and must be flawless.
//

describe('cn - class name utility', () => {
  it('should merge and deduplicate class names correctly', () => {
    // Test case 1: Basic merging
    const result1 = cn('bg-red-500', 'text-white');
    expect(result1).toBe('bg-red-500 text-white');

    // Test case 2: Overriding classes (bg-red-500 should be replaced by bg-blue-500)
    const result2 = cn('bg-red-500', 'p-4', 'bg-blue-500');
    expect(result2).toBe('p-4 bg-blue-500');

    // Test case 3: Conditional classes (false, null, undefined should be ignored)
    const result3 = cn(
      'base-class',
      false && 'class-if-true',
      null,
      undefined,
      'another-class'
    );
    expect(result3).toBe('base-class another-class');

    // Test case 4: Complex object syntax
    const result4 = cn({
      'px-2': true,
      'py-1': false,
      'rounded-md': true,
    });
    expect(result4).toBe('px-2 rounded-md');
    
    // Test case 5: Mixed arrays, objects, and strings
    const result5 = cn(['p-4', 'm-2'], { 'font-bold': true }, 'text-center');
    expect(result5).toBe('p-4 m-2 font-bold text-center');
  });
});
