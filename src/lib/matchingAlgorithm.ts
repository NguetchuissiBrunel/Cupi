import connectDB from '@/lib/database';
import User, { IUser } from '@/models/User';
import Match from '@/models/Match';

interface UserProfile {
  username: string;
  answers: number[];
  questions: string[];
  timestamp: number;
}

interface MatchResult {
  matchFound: boolean;
  matchId?: string;
  matchName?: string;
  compatibility?: number;
  message?: string;
  sharedInterests?: string[];
}

class CupidMatchingAlgorithm {

  async calculateCompatibility(user1: UserProfile, user2: UserProfile): Promise<number> {
    if (user1.answers.length !== user2.answers.length) {
      return 0;
    }

    let score = 0;
    const maxScore = user1.answers.length * 4;

    for (let i = 0; i < user1.answers.length; i++) {
      const diff = Math.abs(user1.answers[i] - user2.answers[i]);
      score += (4 - diff);
    }

    const compatibility = Math.round((score / maxScore) * 100);

    const keyQuestions = [0, 2];
    let bonus = 0;

    keyQuestions.forEach(qIndex => {
      if (user1.answers[qIndex] === user2.answers[qIndex]) {
        bonus += 10;
      }
    });

    return Math.min(100, compatibility + bonus);
  }

  async findBestMatch(newUser: UserProfile): Promise<IUser | null> {
    await connectDB();

    // Find users who are waiting and not the current user
    const waitingUsers = await User.find({
      status: 'waiting',
      username: { $ne: newUser.username }
    }).limit(50); // Limit to avoid performance issues with large DBs

    let bestMatch: IUser | null = null;
    let bestScore = 0;

    for (const waitingUser of waitingUsers) {
      // Cast to UserProfile for calculation
      const waitingUserProfile: UserProfile = {
        username: waitingUser.username,
        answers: waitingUser.answers,
        questions: waitingUser.questions,
        timestamp: waitingUser.createdAt.getTime()
      };

      const compatibility = await this.calculateCompatibility(newUser, waitingUserProfile);

      if (compatibility >= 70 && compatibility > bestScore) {
        bestScore = compatibility;
        bestMatch = waitingUser;
      }
    }

    // Pass the score back attached to the user object temporarily or re-calculate later
    // For simplicity, we just return the user and re-calculate score in addUser
    return bestMatch;
  }

  determineSharedInterests(user1: UserProfile, user2: UserProfile): string[] {
    const interests: string[] = [];

    // Q1: Social Energy
    if (Math.abs(user1.answers[0] - user2.answers[0]) <= 1) {
      if (user1.answers[0] <= 1) interests.push("Amour du cocooning");
      else if (user1.answers[0] >= 3) interests.push("Vie sociale active");
      else interests.push("Équilibre social");
    }

    // Q2: Weekend
    if (Math.abs(user1.answers[1] - user2.answers[1]) <= 1) {
      if (user1.answers[1] <= 1) interests.push("Week-ends détente");
      else if (user1.answers[1] >= 3) interests.push("Soif d'aventure");
      else interests.push("Curiosité culturelle");
    }

    // Q3: Priority
    if (Math.abs(user1.answers[2] - user2.answers[2]) <= 1) {
      const priorities = ["Stabilité", "Famille", "Équilibre", "Voyage", "Ambition"];
      interests.push(`Priorité commune : ${priorities[user1.answers[2]]}`);
    }

    // Q4: Spending
    if (Math.abs(user1.answers[3] - user2.answers[3]) <= 1) {
      if (user1.answers[3] <= 1) interests.push("Gestion prudente");
      else if (user1.answers[3] >= 3) interests.push("Générosité");
    }

    // Q5: Communication
    if (Math.abs(user1.answers[4] - user2.answers[4]) <= 1) {
      interests.push("Communication compatible");
    }

    // Add generic positive traits if list is short
    if (interests.length < 3) {
      // Async call cannot be done easily inside synchronous method without making this method async
      // Since this is for bonus text, let's just skip the extra check or make it sync.
      // Ideally calculateCompatibility should be sync as it doesn't access DB.
      interests.push("Valeurs alignées");
    }

    return interests;
  }

  async addUser(user: UserProfile): Promise<MatchResult> {
    await connectDB();

    // Check if user already exists
    let dbUser = await User.findOne({ username: user.username });
    if (dbUser) {
      // Update existing user
      dbUser.answers = user.answers;
      dbUser.questions = user.questions;
      dbUser.status = 'waiting'; // Reset to waiting on new submission
      dbUser.matchId = undefined;
      dbUser.createdAt = new Date();
      await dbUser.save();
    } else {
      // Create new user
      dbUser = await User.create({
        username: user.username,
        answers: user.answers,
        questions: user.questions,
        status: 'waiting'
      });
    }

    const bestMatch = await this.findBestMatch(user);

    if (bestMatch) {
      const matchProfile: UserProfile = {
        username: bestMatch.username,
        answers: bestMatch.answers,
        questions: bestMatch.questions,
        timestamp: bestMatch.createdAt.getTime()
      };

      const compatibility = await this.calculateCompatibility(user, matchProfile);
      const sharedInterests = this.determineSharedInterests(user, matchProfile);

      // Create Match
      const match = await Match.create({
        users: [user.username, bestMatch.username],
        compatibility,
        sharedInterests
      });

      const matchId = match._id.toString();

      // Update both users
      dbUser.status = 'matched';
      dbUser.matchId = matchId;
      await dbUser.save();

      bestMatch.status = 'matched';
      bestMatch.matchId = matchId;
      await bestMatch.save();

      return {
        matchFound: true,
        matchId,
        matchName: bestMatch.username,
        compatibility,
        sharedInterests,
        message: this.generateLoveMessage(bestMatch.username)
      };
    } else {

      return {
        matchFound: false,
        message: "Nous cherchons ton âme sœur... Patience !"
      };
    }
  }

  generateLoveMessage(matchName: string): string {
    const messages = [
      `Le destin a frappé ! ${matchName} et toi êtes faits l'un pour l'autre.`,
      `Coup de foudre ! ${matchName} partage tes valeurs et tes rêves.`,
      `Les étoiles s'alignent... ${matchName} pourrait être ton âme sœur !`,
      `Le cœur a ses raisons... Trouvé(e) : ${matchName} !`,
      `Cupidon a visé juste ! Rencontre ${matchName}, ta moitié.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  async checkMatch(username: string): Promise<MatchResult> {
    await connectDB();

    const user = await User.findOne({ username });

    if (user && user.status === 'matched' && user.matchId) {
      const match = await Match.findById(user.matchId);

      if (match) {
        const otherUsername = match.users.find(u => u !== username);

        if (otherUsername) {
          return {
            matchFound: true,
            matchName: otherUsername,
            compatibility: match.compatibility,
            sharedInterests: match.sharedInterests || [],
            message: this.generateLoveMessage(otherUsername)
          };
        }
      }
    }

    return { matchFound: false };
  }
}

export const cupidAlgorithm = new CupidMatchingAlgorithm();