import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    sender: string; // username
    receiver: string; // username
    content: string;
    createdAt: Date;
    read: boolean;
}

const MessageSchema = new Schema<IMessage>({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

// Index for faster queries
MessageSchema.index({ sender: 1, receiver: 1 });
MessageSchema.index({ receiver: 1, sender: 1 });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
