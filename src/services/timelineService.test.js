import { describe, it, expect } from 'vitest';
import { generateInitialTimeline, adaptTimeline } from './timelineService';

describe('timelineService', () => {
  it('generates timeline correctly with only core paths (no preferences)', () => {
    const timeline = generateInitialTimeline({ priorities: [] }, {}, []);
    expect(timeline.length).toBe(2);
    expect(timeline[0].type).toBe('MUST');
  });

  it('generates timeline correctly with nice to have preferences included (integration flow)', () => {
    const timeline = generateInitialTimeline({ priorities: ['Merchandise', 'Photo spots'] }, {}, []);
    expect(timeline.length).toBe(4);
    // Asserts sorted order
    expect(timeline[0].time).toBe('17:45');
    expect(timeline[3].time).toBe('19:15');
  });

  it('adapts timeline accurately in edge case: extremely high density (RED status)', () => {
    const baseTimeline = [{ id: 't1', location: 'restroom_1', urgency: 'SUGGESTED' }];
    const adapted = adaptTimeline(baseTimeline, [{ locationId: 'restroom_1', density: 95 }], 0.5);
    expect(adapted[0].status).toBe('RED');
    expect(adapted[0].suggestion).toMatch(/reschedule/i);
  });

  it('adapts timeline accurately in edge case: extreme high momentum but low density', () => {
    const baseTimeline = [{ id: 't1', location: 'restroom_1', urgency: 'SUGGESTED' }];
    const adapted = adaptTimeline(baseTimeline, [{ locationId: 'restroom_1', density: 20 }], 0.9);
    // Even though density is low, momentum > 0.8 triggers RED
    expect(adapted[0].status).toBe('RED');
  });
});
