/**
 * VenueIQ User Movement Simulator.
 * Optimized for 1,000+ users with batch processing and time acceleration.
 */

export class UserSimulator {
  constructor(venue, userCount = 1000) {
    this.venue = venue;
    this.userCount = userCount;
    this.users = Array.from({ length: userCount }, (_, i) => ({
      id: `user_${i}`,
      x: Math.random() * 800,
      y: Math.random() * 500,
      target: this.getRandomTarget(),
      speed: 0.2 + Math.random() * 0.8,
      groupId: i < 5 ? 'HACK-2026' : null // Mock some group members
    }));
    this.isRunning = false;
    this.timeAcceleration = 5; // 1 min = 5 mins per demo requirement
  }

  getRandomTarget() {
    return {
      x: Math.random() * 800,
      y: Math.random() * 500
    };
  }

  start(animCallback, stateCallback) {
    this.isRunning = true;
    this.lastStateTime = 0;
    this.loop(animCallback, stateCallback);
  }

  stop() {
    this.isRunning = false;
  }

  loop(animCallback, stateCallback) {
    if (!this.isRunning) return;

    // Movement Logic
    this.users.forEach(user => {
      const dx = user.target.x - user.x;
      const dy = user.target.y - user.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        user.target = this.getRandomTarget();
      } else {
        const moveStep = (user.speed * this.timeAcceleration) / 6; // Adjusted for 60fps
        user.x += (dx / dist) * moveStep;
        user.y += (dy / dist) * moveStep;
      }
    });

    if (animCallback) animCallback(this.users);
    
    // Throttle heavy React state updates to 2 FPS
    const now = Date.now();
    if (now - this.lastStateTime > 500 && stateCallback) {
      stateCallback(this.users);
      this.lastStateTime = now;
    }
    
    // Smooth animation at 60fps
    requestAnimationFrame(() => this.loop(animCallback, stateCallback));
  }
}
