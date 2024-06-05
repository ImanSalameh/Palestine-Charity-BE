// badgeRoutes.ts

import { Router, Request, Response } from 'express';
import { IUser, User } from '../models/Users';
import { IBadge, Badge } from '../models/badge';


const router = Router();


// Define badge types and their corresponding token thresholds
const badgeTypes = [
    { name: "Silver Contributor", threshold: 100, description: 'The user donated 10$ in total!' },
    { name: "Bronze Contributor", threshold: 5000, description: 'The user donated 500$ in total!' }

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
                        description: badgeType.description,
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



// Route to trigger badge checks for all users
router.post('/check-badges', async (req: Request, res: Response) => {
    try {
        // Fetch all users
        const users = await User.find();

        // Iterate through users and check and award badges
        for (const user of users) {
            await checkAndAwardBadges(user._id, user.token); // Assuming token is the field storing user's tokens
        }

        res.status(200).json({ message: 'Badge checks completed successfully' });
    } catch (error) {
        console.error('Error checking badges:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to trigger badge checks for a specific user
router.post('/check-badges/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        // Fetch the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check and award badges for the user
        await checkAndAwardBadges(userId, user.token); // Assuming token is the field storing user's tokens

        res.status(200).json({ message: 'Badge checks completed for user' });
    } catch (error) {
        console.error('Error checking badges for user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to fetch badges for a specific user
router.get('/user-badges/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Fetch all badges for the user from the database
        const userBadges = await Badge.find({ user: userId });

        res.status(200).json({ userBadges });
    } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
