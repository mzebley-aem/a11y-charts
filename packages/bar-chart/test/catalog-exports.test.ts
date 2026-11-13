import { describe, expect, it } from 'vitest';
import * as root from '../src/index.js';
import * as core from '../src/core.js';
import { ENGLISH_MESSAGES } from '../src/messages.js';

describe('English catalog exports', () => {
  it('exports ENGLISH_BAR_CHART_MESSAGES from the root and core entries as the same object as ENGLISH_MESSAGES', () => {
    expect(root.ENGLISH_BAR_CHART_MESSAGES).toBe(ENGLISH_MESSAGES);
    expect(core.ENGLISH_BAR_CHART_MESSAGES).toBe(ENGLISH_MESSAGES);
    expect(root.ENGLISH_MESSAGES).toBe(ENGLISH_MESSAGES);
    expect(core.ENGLISH_MESSAGES).toBe(ENGLISH_MESSAGES);
  });
});
