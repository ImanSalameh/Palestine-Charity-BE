import mongoose, { Schema, Document } from 'mongoose';
import { IUser, User } from '../models/Users';


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
const badgeSchema: Schema<IBadge> = new Schema({
    badgePic: { type: String, required: true },
    badgeName: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    acquired: { type: Boolean, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});




// Define badge types and their corresponding token thresholds
const badgeTypes = [
    { name: "Silver Contributor", threshold: 100 },
    { name: "Bronze Contributor", threshold: 5000 }

];

// Function to check and award badges for a specific user
async function checkAndAwardBadges(userId: string, userTokens: number) {
    try {
        // Fetch the user document by userId
        const user = await User.findById(userId);

        if (!user) {
            console.log(`User not found with ID ${userId}`);
            return;
        }

        for (const badgeType of badgeTypes) {
            if (userTokens >= badgeType.threshold) {
                // Check if the user already has the badge
                const userHasBadge = await Badge.findOne({ user: userId, description: badgeType.name });

                if (!userHasBadge) {
                    // Award the badge to the user
                    const newBadge: IBadge = new Badge({
                        user: userId,
                        description: badgeType.name,
                        badgeName: badgeType.name,
                        badgePic: getBadgePictureURL(badgeType.name),
                        date: new Date(),
                        acquired: true
                    });

                    // Save the new badge document
                    const savedBadge = await newBadge.save();

                    // Push the ID of the newly created badge into the user's Badges array
                    user.Badges.push(savedBadge._id);



                    // Save the user document to update the badges array
                    await user.save();

                    // Log badge awarding
                    console.log(`Badge "${badgeType.name}" awarded to user ${userId}`);
                }
            }
        }
    } catch (error) {
        console.error('Error checking and awarding badges:', error);
    }
}



// Function to get the URL or path to the badge picture based on the badge type
function getBadgePictureURL(badgeName: string): string {
    // Implement logic to map badge names to picture URLs or paths

    if (badgeName === "Bronze Contributor") {
        return "https://www.shutterstock.com/image-illustration/golden-seal-ribbons-isolated-on-600nw-1556748107.jpg";
    } else if (badgeName === "Silver Contributor") {
        return "https://st.depositphotos.com/1575949/1824/v/950/depositphotos_18244417-stock-illustration-silver-prize-ribbon.jpg";
    }
    // Add more conditions as needed for other badge types
    return "No Badge";
}



// Create and export the Badge model
export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);