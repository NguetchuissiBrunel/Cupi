import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMatch extends Document {
    users: string[]; // usernames
    compatibility: number;
    sharedInterests: string[];
    createdAt: Date;
}

const MatchSchema = new Schema<IMatch>({
    users: { type: [String], required: true },
    compatibility: { type: Number, required: true },
    sharedInterests: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
});

// Avoid recompilation error in development
const Match: Model<IMatch> = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default Match;
