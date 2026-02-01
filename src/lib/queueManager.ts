interface QueueUser {
  userId: string;
  username: string;
  personalityVector: number[];
  addedAt: number;
  matchAttempts: number;
}

class QueueManager {
  private static instance: QueueManager;
  private queue: QueueUser[] = [];
  private maxSize = 1000;

  private constructor() {}

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  addToQueue(user: QueueUser): void {
    // Limiter la taille de la file
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // Retirer le plus ancien
    }

    this.queue.push({
      ...user,
      matchAttempts: 0
    });

    console.log(`User ${user.username} added to queue. Queue size: ${this.queue.length}`);
  }

  removeFromQueue(userId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(user => user.userId !== userId);
    return this.queue.length < initialLength;
  }

  getQueuePosition(userId: string): number {
    return this.queue.findIndex(user => user.userId === userId) + 1;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getNextUsers(count: number = 5): QueueUser[] {
    return this.queue.slice(0, count);
  }

  cleanupInactiveUsers(maxAge: number = 30 * 60 * 1000): number {
    const now = Date.now();
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(user => 
      (now - user.addedAt) < maxAge
    );
    
    return initialLength - this.queue.length;
  }

  getQueueStats() {
    const now = Date.now();
    const activeUsers = this.queue.filter(user => 
      (now - user.addedAt) < 5 * 60 * 1000
    ).length;

    return {
      total: this.queue.length,
      active: activeUsers,
      avgWaitTime: this.calculateAverageWaitTime(),
      matchesToday: this.getMatchesToday()
    };
  }

  private calculateAverageWaitTime(): string {
    if (this.queue.length === 0) return '1-2 min';
    
    const waitTimes = this.queue.map(user => Date.now() - user.addedAt);
    const avg = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
    
    const minutes = Math.floor(avg / 60000);
    
    if (minutes < 2) return '1-2 min';
    if (minutes < 5) return '2-5 min';
    if (minutes < 10) return '5-10 min';
    return '10+ min';
  }

  private getMatchesToday(): number {
    // Simuler des matchs basés sur l'activité
    const baseMatches = Math.floor(this.queue.length / 10);
    const hour = new Date().getHours();
    
    // Plus de matchs en soirée
    const hourMultiplier = hour >= 18 && hour <= 23 ? 2 : 
                          hour >= 12 && hour <= 14 ? 1.5 : 1;
    
    return Math.floor(baseMatches * hourMultiplier);
  }
}

export const queueManager = QueueManager.getInstance();