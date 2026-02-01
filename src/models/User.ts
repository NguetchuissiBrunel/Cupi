import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string; // Optional because we might have guest users or old users
    image?: string;
    bio?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    preferences?: 'male' | 'female' | 'everyone';
    answers: number[];
    questions: string[];
    status: 'waiting' | 'matched' | 'chatting' | 'offline';
    matchId?: string; // ID of the match document if matched
    followers?: string[];
    following?: string[];
    createdAt: Date;
    lastSeen?: Date;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
    password: { type: String },
    image: { type: String },
    bio: { type: String },
    age: { type: Number },
    gender: { type: String },
    preferences: { type: String },
    answers: { type: [Number], required: true },
    questions: { type: [String], required: true },
    status: {
        type: String,
        enum: ['waiting', 'matched', 'chatting', 'offline'],
        default: 'waiting'
    },
    matchId: { type: String },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
});

// Avoid recompilation error in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
