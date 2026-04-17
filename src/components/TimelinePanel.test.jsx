import { render, screen } from '@testing-library/react';
import React from 'react';
import TimelinePanel from './TimelinePanel';
import { describe, it, expect } from 'vitest';

describe('TimelinePanel', () => {
  it('renders generating prompt when timeline is empty', () => {
    render(<TimelinePanel timeline={[]} />);
    expect(screen.getByText(/Generating optimized schedule.../i)).toBeInTheDocument();
  });

  it('renders timeline activities clearly mapping color blocks', () => {
    const mockTimeline = [
      { id: 1, activity: 'Security Check', status: 'RED', time: '10:00 AM', suggestion: 'Avoid now' },
      { id: 2, activity: 'Registration', status: 'GREEN', time: '10:15 AM', suggestion: 'Good to go' },
    ];
    render(<TimelinePanel timeline={mockTimeline} />);
    expect(screen.getByText(/Security Check/i)).toBeInTheDocument();
    expect(screen.getByText(/Avoid now/i)).toBeInTheDocument();
    expect(screen.queryByText(/Generating optimized schedule.../i)).not.toBeInTheDocument();
  });
});
