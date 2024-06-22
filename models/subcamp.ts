import mongoose, { Schema, Document } from 'mongoose';

export interface ISubCampaign extends Document {
    parentCampaign: mongoose.Types.ObjectId;
    influencer: mongoose.Types.ObjectId;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    goalAmount: number;
    currentAmount: number;
    donations: mongoose.Types.ObjectId[];
    leaderboard: { userId: mongoose.Types.ObjectId; amount: number }[];
    approved: boolean; // Approved field
    status: string;
}

const subCampaignSchema: Schema = new Schema({
    parentCampaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    influencer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    goalAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    donations: [{ type: Schema.Types.ObjectId, ref: 'Donation' }],
    leaderboard: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, amount: { type: Number, default: 0 } }],
    approved: { type: Boolean, default: false }, // Default to false until approved
    status: { type: String, default: 'Active' } // Add this line
});

export default mongoose.model<ISubCampaign>('SubCampaign', subCampaignSchema);
