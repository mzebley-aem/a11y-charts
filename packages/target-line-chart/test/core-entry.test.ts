import { describe, expect, it } from 'vitest';
import { resolveConfig, validateData } from '../src/core.js';

describe('line core entry', () => {
  it('exposes config and validation without importing the custom element', () => {
    expect(resolveConfig(undefined).locale).toBe('en-US');
    expect(validateData([{ x: 'a', actual: 1 }]).valid).toBe(true);
  });
});
