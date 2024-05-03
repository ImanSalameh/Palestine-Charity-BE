import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './Users';
import { ICampaign } from './campaigns';

// Define the interface for the Donation document
export interface IDonation extends Document {
    user: IUser['_id'];
    campaign: ICampaign['_id'];
    amount: number;
    donationDate: Date;
    tokens: number; // Tokens earned for the donation
    paymentMethod?: string
}

// Define the schema for the Donation document
const donationSchema: Schema<IDonation> = new Schema<IDonation>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    amount: { type: Number, required: true },
    donationDate: { type: Date, default: Date.now },
    tokens: { type: Number, default: 0 }, // Default token value is 0
    paymentMethod: { type: String }
});

// to calculate and set the tokens earned before saving
donationSchema.pre<IDonation>('save', function (next) {
    // Calculate tokens earned based on donation amount
    this.tokens = this.amount * 10;
    next();
});

// Create and export the Donation model
export const Donation = mongoose.model<IDonation>('Donation', donationSchema);


//when we return the suer has to return the badges   DONE

//donation date           DONE
//for every amount of donation * 10 (token) -> مثلا اذا تبرع ب 10 دولار منعطي 100 توكين      DONE

//payment method (string)     DONE
// ولازم لما يعمل دونيشين نزيد على ال الكرنت اماونت والليدر بورد    DONE
//وهاد كلو لازم يكون بالدونيشين ريكورد عند اليوزر  DONE


//badge -> pic and description, date , aquired (boolean) , user   DONE
//check badges -> مثلا اذا تبرع ب 1000 توكن منعطي بادج معينة او مثلا اذا تبرع ب الفين DONE


//favorit  DONE

// user id and campaign id have to be in the body        DONE

//when get the campaign , it get the donation record , no need for the password and favorite and donation record for each user     DONE

// when add a favorite has to check if its alraedy added       DONE



//connect everything with the donation tokens and badges DONE


//leaderboard top 10 donores for every campaign who paid more

//api for every donor   chart  عدد المتبرعين والبلد ,ونسبة التبرع عشان ترجع لل

//عدد المتبرعين وكم تبرع