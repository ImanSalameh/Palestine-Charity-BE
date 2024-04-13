import mongoose, { Schema, Document } from 'mongoose';

// Define interface for Campaign document
export interface ICampaign extends Document {
    campaignName: string;
    campaignImage: string;
    organizationName: string;
    goalAmount: number;
    status: "Active" | "Suspended" | "Ended"; // Union type for allowed values
    currentAmount?: number; // Making currentAmount optional
    startDate: Date;
    endDate: Date;
    leaderboard: string[];
    description?: string;
}

// Define schema for Campaign
const campaignSchema: Schema<ICampaign> = new Schema<ICampaign>({
    campaignName: { type: String, required: true },
    campaignImage: { type: String, required: true },
    organizationName: { type: String, required: true },
    goalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Active", "Suspended", "Ended"], required: true }, // Specify allowed values
    currentAmount: { type: Number }, // Optional currentAmount
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    leaderboard: { type: [String], default: [] },
    description: { type: String }
});


export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
