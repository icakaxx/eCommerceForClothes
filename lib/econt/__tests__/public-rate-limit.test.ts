import { describe, expect, it } from 'vitest';
import { allowPublicEcontLookup } from '@/lib/econt/public-rate-limit';

describe('public Econt lookup rate limit', () => {
  it('allows a burst under the cap and then blocks', () => {
    const ip = `test-${Date.now()}`;
    for (let i = 0; i < 40; i += 1) {
      expect(allowPublicEcontLookup(ip, 40, 60_000)).toBe(true);
    }
    expect(allowPublicEcontLookup(ip, 40, 60_000)).toBe(false);
  });
});
