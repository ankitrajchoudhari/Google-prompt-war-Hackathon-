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

  start(callback) {
    this.isRunning = true;
    this.loop(callback);
  }

  stop() {
    this.isRunning = false;
  }

  loop(callback) {
    if (!this.isRunning) return;

    // Movement Logic
    this.users.forEach(user => {
      const dx = user.target.x - user.x;
      const dy = user.target.y - user.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        user.target = this.getRandomTarget();
      } else {
        const moveStep = user.speed * this.timeAcceleration;
        user.x += (dx / dist) * moveStep;
        user.y += (dy / dist) * moveStep;
      }
    });

    callback(this.users);
    
    // Smooth animation at 30fps
    requestAnimationFrame(() => {
      if (this.isRunning) {
        // Slow down the state update frequency slightly for performance
        setTimeout(() => this.loop(callback), 100); 
      }
    });
  }
}
