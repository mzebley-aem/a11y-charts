import { describe, expect, it } from 'vitest';
import { resolveConfig, validateBarData } from '../src/core.js';

describe('bar core entry', () => {
  it('exposes config and validation without importing the custom element', () => {
    expect(resolveConfig(undefined).locale).toBe('en-US');
    expect(validateBarData([{ id: 'a', label: 'A', value: 1 }]).valid).toBe(true);
  });
});
