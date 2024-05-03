import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './Users';


// Define the interface for the Badge document
export interface IBadge extends Document {
    badgePic: string; // URL or path to the badge picture
    badgeName: string;
    description: string; // Description of the badge
    date: Date; // Date the badge was acquired
    acquired: boolean; // Flag indicating if the badge has been acquired
    user: IUser['_id']; // Reference to the user who owns the badge

}

// Define the schema for the Badge document
const badgeSchema: Schema<IBadge> = new Schema<IBadge>({
    badgePic: { type: String, required: true },
    badgeName: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    acquired: { type: Boolean, default: false }, // Default value for acquired is false
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

});

// Create and export the Badge model
export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);