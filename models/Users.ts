import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { ICampaign } from './campaigns';
import { IBadge, Badge } from '../models/badge';


// Define interface for User document
export interface IUser extends Document {
    Name: string;
    profilePicture: string;
    backgroundPicture: string;
    token: number;
    Address: string;
    Badges: IBadge[]; // Use IBadge interface
    Age: Date;
    Donationrecords: [{ type: Schema.Types.ObjectId; ref: 'donation' }]; // Update Donationrecords field
    favorite: ICampaign[];
    PhoneNumber: string;
    Email: string;
    Password: string;
    Role: string;
    purchasedItems: string[]; // Add purchased items field

}

// Define schema for User
const userSchema: Schema<IUser> = new Schema<IUser>({
    Name: { type: String },
    profilePicture: {type: String, default:'hello'},
    backgroundPicture: {type: String},
    token: { type: Number, default: 0 }, // Set default value for tokens field
    Address: { type: String },
    Badges: { type: [Schema.Types.ObjectId], ref: 'Badge', default: [] }, // Use ref to 'Badge' and set default value to empty array
    Age: { type: Date },
    Donationrecords: [{ type: Schema.Types.ObjectId, ref: 'donation' }], // Updated Donationrecords field
    favorite: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
    PhoneNumber: { type: String },
    Email: { type: String },
    Password: { type: String },
    Role: { type: String },
    purchasedItems: { type: [String], default: [] } // Initialize purchased items array
}, { discriminatorKey: 'type' });


// Donor interface
export interface IDonor extends IUser {
    DonorID: string;
    amountDonated: number;
    DonorName: string;
    PaymentMethod: string;
    Gender: string;
}

// Donor schema (inherits from User)
const donorSchema: Schema<IDonor> = new Schema<IDonor>({
    DonorID: { type: String, required: true },
    amountDonated: { type: Number, required: true },
    DonorName: { type: String, required: true },
    PaymentMethod: { type: String, required: true },
    Gender: { type: String, required: true },
});




// Organizat
export interface IOrganization extends IUser {
    OrganizationID: number;
    Type: string;
    Description: string;
    Revenue: mongoose.Types.Decimal128;
    CEO: string;
    Industry: string;
}


// Organization schema (inherits from User)
const organizationSchema: Schema<IOrganization> = new Schema<IOrganization>({
    OrganizationID: { type: Number, required: true },
    Type: { type: String, required: true },
    Description: { type: String, required: true },
    Revenue: { type: mongoose.Types.Decimal128, required: true },
    CEO: { type: String, required: true },
    Industry: { type: String, required: true }
});

// Admin interface
export interface IAdmin extends IUser {
    AdminID: number;
    Gender: string;
    Role: string;
}

// Admin schema (inherits from User)
const adminSchema: Schema<IAdmin> = new Schema<IAdmin>({
    AdminID: { type: Number, required: true },
    Gender: { type: String, required: true },
    Role: { type: String, required: true },
});

// Influencer interface
export interface IInfluencer extends IUser {
    InfluencerID: number;
    Gender: string;
    Contract: string;
}

// Influencer schema (inherits from User)
const influencerSchema: Schema<IInfluencer> = new Schema<IInfluencer>({
    InfluencerID: { type: Number, required: true },
    Gender: { type: String, required: true },
    Contract: { type: String, required: true },
});



// Create models
export const User = mongoose.model<IUser>('User', userSchema);
export const Organization = User.discriminator<IOrganization>('Organization', organizationSchema);
export const Admin = User.discriminator<IAdmin>('Admin', adminSchema);
export const Influencer = User.discriminator<IInfluencer>('Influencer', influencerSchema);
export const Donor = User.discriminator<IDonor>('Donor', donorSchema);