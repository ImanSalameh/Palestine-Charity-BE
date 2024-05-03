import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProfile extends Document {
    userId: mongoose.Types.ObjectId;
    Name: string;
    Bio: string;
    Userimage: string;
    Background: string;
}

const profileSchema: Schema<IProfile> = new Schema<IProfile>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    Name: { type: String },
    Bio: { type: String },
    Userimage: { type: String },
    Background: { type: String }
});

profileSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
