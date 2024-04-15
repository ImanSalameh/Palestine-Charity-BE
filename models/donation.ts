// donation.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './Users';
import { ICampaign } from './campaigns';

export interface IDonation extends Document {
    user: IUser['_id'];
    campaign: ICampaign['_id'];
    amount: number;

}

const donationSchema: Schema<IDonation> = new Schema<IDonation>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    amount: { type: Number, required: true }

});

export const Donation = mongoose.model<IDonation>('Donation', donationSchema);
