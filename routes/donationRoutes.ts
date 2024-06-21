// donationRoutes.ts

import { Router, Request, Response } from 'express';
import { IUser, User } from '../models/Users';
import { ICampaign, Campaign } from '../models/campaigns';
import { Donation } from '../models/donation';
import { IBadge, Badge } from '../models/badge';
import { sendMail } from '../mailer';



const router = Router();



// Route to make a donation
router.post('/donate', async (req: Request, res: Response) => {
    try {
        const { userId, campaignId, amount, anonymous } = req.body;

        // Create a new donation
        const newDonation = new Donation({
            user: anonymous ? 'Anonymous' : userId,
            campaign: campaignId,
            amount: amount,
            tokens: anonymous ? amount * 10 : 0 // Calculate tokens earned for anonymous donations
        });

        // Save the donation
        const savedDonation = await newDonation.save();

        // Fetch the campaign document
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Update the current amount of the campaign
        campaign.currentAmount += amount;
        await campaign.save();

        let user: IUser | null = null;

        if (!anonymous) {
            user = await User.findById(userId);
            if (user) {
                await User.findByIdAndUpdate(userId, { $inc: { token: amount * 10 } });
            }
        }

        if (anonymous) {
            user = await User.findById(userId);
            if (user) {
                user.token += amount * 10;
                await user.save();
                // Check and award badges to the user for anonymous donations
                await checkAndAwardBadges(userId, user.token); // Assuming token is the field storing user's tokens
            }
        }

        // Update the user's donation records
        if (user && !anonymous) {
            user.Donationrecords.push(savedDonation._id);
            await user.save();

            // Check and award badges to the user
            await checkAndAwardBadges(userId, user.token); // Assuming token is the field storing user's tokens
        }


        // Send confirmation email to the user
        if (user) {
            const emailText = `Dear ${anonymous ? 'Anonymous Donor' : user.Name},\n\nThank you for your generous donation of $${amount} to the ${campaign.campaignName} campaign. Your support is greatly appreciated.\n\nBest regards,\n PalHop Team`;
            const emailHtml = `<p>Dear ${anonymous ? 'Anonymous Donor' : user.Name},</p><p>Thank you for your generous donation of $${amount} to the ${campaign.campaignName} campaign. Your support is greatly appreciated.</p><p>Best regards,<br>\nPalHop Team</p>`;
            const emailSubject = 'Thank You for Your Donation';

            await sendMail(user.Email, emailSubject, emailText, emailHtml);
        }

        res.status(201).json({ message: 'Donation made successfully' });
    } catch (error) {
        console.error('Error making donation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
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




// Route to make a donation by non-registered user
router.post('/donate-non-registered', async (req: Request, res: Response) => {
    try {
        const { campaignId, amount } = req.body;

        // Create a new donation without user field for non-registered users
        const newDonation = new Donation({
            campaign: campaignId,
            amount: amount
        });

        // Save the donation
        const savedDonation = await newDonation.save();

        // Fetch the campaign document
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Update the current amount of the campaign
        campaign.currentAmount += amount;
        await campaign.save();

        res.status(201).json({ message: 'Donation made successfully by non-registered user', donation: savedDonation });
    } catch (error) {
        console.error('Error making donation by non-registered user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
