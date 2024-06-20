import mongoose, { Schema, Document } from 'mongoose';
import { ICampaign } from './campaigns';
import { IUser } from './Users';

export interface ISubCampaign extends Document {
    parentCampaign: mongoose.Types.ObjectId;
    influencer: mongoose.Types.ObjectId;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    goalAmount: number;
    currentAmount: number;
    status: string;
    donations: mongoose.Types.ObjectId[];
    leaderboard: { userId: mongoose.Types.ObjectId, amount: number }[];
}

// Define the schema for the SubCampaign document
const subCampaignSchema: Schema<ISubCampaign> = new Schema({
    parentCampaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    influencer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    goalAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Ended'], default: 'Active' },
    donations: [{ type: Schema.Types.ObjectId, ref: 'Donation' }],
    leaderboard: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, amount: { type: Number, default: 0 } }]
});


// Create and export the SubCampaign model
const SubCampaign = mongoose.model<ISubCampaign>('SubCampaign', subCampaignSchema);
export default SubCampaign;
