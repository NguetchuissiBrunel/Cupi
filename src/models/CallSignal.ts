import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICallSignal extends Document {
    sender: string;
    receiver: string;
    type: 'offer' | 'answer' | 'ice-candidate' | 'invite' | 'accept' | 'reject' | 'end';
    data: any;
    createdAt: Date;
}

const CallSignalSchema = new Schema<ICallSignal>({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, expires: 60 } // Signals expire after 60s
});

const CallSignal: Model<ICallSignal> = mongoose.models.CallSignal || mongoose.model<ICallSignal>('CallSignal', CallSignalSchema);

export default CallSignal;
