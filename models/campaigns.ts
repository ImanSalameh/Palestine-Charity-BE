import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './Users';
import { IDonor } from './Users';




// Define interface for Campaign document
export interface ICampaign extends Document {
    campaignName: string;
    campaignImage: string;
    organizationName: string;
    goalAmount: number;
    status: "Active" | "Suspended" | "Ended";
    currentAmount: number;
    startDate: Date;
    endDate: Date;
    leaderboard: IDonor[];
    description: string;
    newsDashboard: string[];
}

// Define schema for Campaign
const campaignSchema: Schema<ICampaign> = new Schema<ICampaign>({
    campaignName: { type: String, required: true },
    campaignImage: { type: String, required: true },
    organizationName: { type: String, required: true },
    goalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Active", "Suspended", "Ended"], required: true },
    currentAmount: { type: Number, default: 0 }, // Set initial value to 0
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    leaderboard: { type: [{ userId: String, amountDonated: Number }], default: [] },
    description: { type: String },
    newsDashboard: { type: [String], default: [] }
});






export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);


    //donation date
    //for every amount of donation * 10 (token) -> مثلا اذا تبرع ب 10 دولار منعطي 100 توكين
    //check badges -> مثلا اذا تبرع ب 1000 توكن منعطي بادج معينة او مثلا اذا تبرع ب الفين 
    //payment method (string)
    // ولازم لما يعمل دونيشين نزيد على ال الكرنت اماونت والليدر بورد
    //وهاد كلو لازم يكون بالدونيشين ريكورد عند اليوزر


    //badge -> pic and description, date , aquired (boolean) , user
    //api for every donor   chart  عدد المتبرعين والبلد ,ونسبة التبرع عشان ترجع لل