import { describe, it, expect, beforeEach } from 'vitest';
import { model } from './mlPredictionService';

describe('mlPredictionService', () => {
  it('should compute base predictions correctly with nominal values (core path)', () => {
    const pred = model.predict(10, 10, 0.5, 0.2); // (10*0.45) + (10*0.35) + (5*0.15) + (1*0.05) + 2.4 => 4.5 + 3.5 + 0.75 + 0.05 + 2.4 = 11.2
    expect(pred).toBeGreaterThan(0);
    expect(pred).toBe(11);
  });

  it('should handle edge case: all 0 inputs', () => {
    const pred = model.predict(0, 0, 0, 0); 
    // expects to be at least 1, but actually 2.4 rounded is 2, wait... Math.round(2.4) is 2.
    expect(pred).toBe(2);
  });

  it('should handle negative input edge cases gracefully', () => {
    const pred = model.predict(-100, -100, -50, -10);
    // Formula will yield highly negative pred, but Math.max(1, Math.round(pred)) should return 1.
    expect(pred).toBe(1);
  });

  it('should handle extreme positive inputs (stress test)', () => {
    const pred = model.predict(999999, 999999, 100, 100);
    expect(pred).toBeGreaterThan(100000); // Ensures formula scales linearly without crashing
  });
});
