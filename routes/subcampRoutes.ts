import express, { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import SubCampaign, { ISubCampaign } from '../models/subcamp';
import { IUser, User } from '../models/Users';
import { Donation } from '../models/donation';
import { IBadge, Badge } from '../models/badge';

import mongoose from 'mongoose';
import { Campaign } from '../models/campaigns';


const router = express.Router();
// Create a new sub-campaign
router.post('/sub-campaigns', async (req: Request, res: Response) => {
    try {
        const { name, description, parentCampaignId, goalAmount, startDate, endDate, influencer } = req.body;

        // Validate required fields
        if (!name || !description || !parentCampaignId || !goalAmount || !startDate || !endDate || !influencer) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Fetch the parent campaign
        const parentCampaign = await Campaign.findById(parentCampaignId);
        if (!parentCampaign) {
            return res.status(404).json({ message: 'Parent campaign not found' });
        }

        // Create the sub-campaign
        const newSubCampaign = new SubCampaign({
            name,
            description,
            parentCampaign: parentCampaignId,
            goalAmount,
            startDate,
            endDate,
            influencer,
            campaignImage: parentCampaign.campaignImage // Inherit the campaign image from the parent campaign
        });

        const savedSubCampaign = await newSubCampaign.save();

        res.status(201).json({ message: 'Sub-campaign created successfully', subCampaign: savedSubCampaign });
    } catch (error) {
        console.error('Error creating sub-campaign:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to donate to a sub-campaign
router.post('/donate/sub-campaign', async (req: Request, res: Response) => {
    try {
        const { userId, subCampaignId, amount, anonymous } = req.body;

        // Validate IDs
        if (!isValidObjectId(userId) || !isValidObjectId(subCampaignId)) {
            return res.status(400).json({ message: 'Invalid user ID or sub-campaign ID' });
        }

        // Create a new donation
        const newDonation = new Donation({
            user: anonymous ? 'Anonymous' : userId,
            subCampaign: subCampaignId,
            amount: amount,
            tokens: anonymous ? amount * 10 : 0
        });

        const savedDonation = await newDonation.save();

        // Fetch sub-campaign
        let subCampaign: any = await SubCampaign.findById(subCampaignId);
        if (!subCampaign) {
            return res.status(404).json({ message: 'Sub-campaign not found' });
        }

        // Update sub-campaign
        subCampaign.currentAmount += amount;
        subCampaign.donations.push(savedDonation._id);

        // Update leaderboard
        const donorIndex = subCampaign.leaderboard.findIndex((entry: any) => entry.userId.equals(userId));
        if (donorIndex !== -1) {
            // Update existing donor's amount
            subCampaign.leaderboard[donorIndex].amount += amount;
        } else {
            // Add new donor to leaderboard
            subCampaign.leaderboard.push({ userId: userId, amount: amount });
        }

        // Sort leaderboard by amount (descending)
        subCampaign.leaderboard.sort((a: any, b: any) => b.amount - a.amount);

        // Limit leaderboard to top 10 donors
        subCampaign.leaderboard = subCampaign.leaderboard.slice(0, 10);

        // Check if sub-campaign goal amount is reached
        if (subCampaign.currentAmount >= subCampaign.goalAmount) {
            subCampaign.status = 'Ended';

            // Get the parent campaign ID from the sub-campaign
            const parentCampaignId = subCampaign.parentCampaign;

            // Find the parent campaign
            const parentCampaign = await Campaign.findById(parentCampaignId);
            if (!parentCampaign) {
                return res.status(404).json({ message: 'Parent campaign not found' });
            }

            // Calculate the total donation amount from the sub-campaign
            const subCampaignDonations = await Donation.aggregate([
                { $match: { subCampaign: subCampaign._id } },
                { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
            ]);

            const totalAmount = subCampaignDonations.length > 0 ? subCampaignDonations[0].totalAmount : 0;

            // Update the parent campaign's total donation amount
            parentCampaign.currentAmount += totalAmount;
            await parentCampaign.save();
        }

        await subCampaign.save();

        // Update user's token balance if not anonymous
        if (!anonymous) {
            const user = await User.findByIdAndUpdate(userId, { $inc: { token: amount * 10 } }, { new: true });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
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

// Get all sub-campaigns
router.get('/sub-campaigns', async (req: Request, res: Response) => {
    try {
        // Query all sub-campaigns from the database
        const subCampaigns = await SubCampaign.find();



        res.status(200).json({ subCampaigns });

    } catch (error) {
        console.error('Error retrieving sub-campaigns:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// GET leaderboard of a sub-campaign
router.get('/sub-campaigns/:subCampaignId/leaderboard', async (req: Request, res: Response) => {
    try {
        const { subCampaignId } = req.params;

        // Find the sub-campaign by ID
        const subCampaign: ISubCampaign | null = await SubCampaign.findById(subCampaignId);

        if (!subCampaign) {
            return res.status(404).json({ message: 'Sub-campaign not found' });
        }

        // Populate user details in leaderboard entries
        const leaderboard = await Promise.all(subCampaign.leaderboard.map(async (entry) => {
            // Fetch user details based on user ID stored in the leaderboard entry
            const user: IUser | null = await User.findById(entry.userId);
            if (!user) {
                return { id: entry.userId, name: 'Unknown', amount: entry.amount, role: 'Unknown' };
            }

            return { id: entry.userId, name: user.Name, amount: entry.amount, role: user.Role };
        }));

        // Return the populated leaderboard
        res.status(200).json({ leaderboard });

    } catch (error) {
        console.error('Error fetching sub-campaign leaderboard:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Get all sub-campaigns of a campaign
router.get('/campaigns/:id/sub-campaigns', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find sub-campaigns by parent campaign ID
        const subCampaigns = await SubCampaign.find({ parentCampaign: id });

        res.status(200).json(subCampaigns);
    } catch (error) {
        console.error('Error fetching sub-campaigns:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to get information of a specific sub-campaign
router.get('/sub-campaigns/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid sub-campaign ID' });
        }

        // Fetch sub-campaign details
        const subCampaign = await SubCampaign.findById(id)
            .populate('donations', 'amount user tokens')  // Populate donation details
            .populate('leaderboard.userId', 'name role'); // Populate user details in leaderboard

        if (!subCampaign) {
            return res.status(404).json({ message: 'Sub-campaign not found' });
        }

        res.status(200).json({ subCampaign });
    } catch (error) {
        console.error('Error fetching sub-campaign details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// API endpoint to get all sub-campaigns of a specific influencer
router.get('/influencer/:influencerId/sub-campaigns', async (req: Request, res: Response) => {
    try {
        const { influencerId } = req.params;

        // Validate influencerId
        if (!isValidObjectId(influencerId)) {
            return res.status(400).json({ message: 'Invalid influencer ID' });
        }

        // Find the influencer
        const influencer = await User.findById(influencerId);
        if (!influencer) {
            return res.status(404).json({ message: 'Influencer not found' });
        }

        // Find all sub-campaigns associated with the influencer
        const subCampaigns = await SubCampaign.find({ influencer: influencerId });

        res.status(200).json({ subCampaigns });
    } catch (error) {
        console.error('Error fetching sub-campaigns for influencer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});





// Approve a sub-campaign
router.post('/sub-campaigns/:id/approve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find and update the sub-campaign
        const subCampaign = await SubCampaign.findByIdAndUpdate(id, { approved: true }, { new: true });

        if (!subCampaign) {
            return res.status(404).json({ message: 'Sub-campaign not found' });
        }

        res.status(200).json({ message: 'Sub-campaign approved successfully', subCampaign });
    } catch (error) {
        console.error('Error approving sub-campaign:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// API endpoint to merge sub-campaign donations with parent campaign
router.post('/sub-campaigns/merge-donations', async (req: Request, res: Response) => {
    try {
        const { subCampaignId } = req.body;

        // Validate subCampaignId
        if (!subCampaignId) {
            return res.status(400).json({ message: 'Sub-campaign ID is required' });
        }

        // Find the sub-campaign
        const subCampaign = await SubCampaign.findById(subCampaignId);
        if (!subCampaign) {
            return res.status(404).json({ message: 'Sub-campaign not found' });
        }

        // Get the parent campaign ID from the sub-campaign
        const parentCampaignId = subCampaign.parentCampaign;

        // Find the parent campaign
        const parentCampaign = await Campaign.findById(parentCampaignId);
        if (!parentCampaign) {
            return res.status(404).json({ message: 'Parent campaign not found' });
        }

        // Calculate the total donation amount from the sub-campaign
        const subCampaignDonations = await Donation.aggregate([
            { $match: { subCampaign: subCampaign._id } },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ]);

        const totalAmount = subCampaignDonations.length > 0 ? subCampaignDonations[0].totalAmount : 0;

        // Update the parent campaign's total donation amount
        parentCampaign.currentAmount += totalAmount;
        await parentCampaign.save();

        // Respond with success message
        res.status(200).json({ message: 'Donation amounts merged successfully' });
    } catch (error) {
        console.error('Error merging donations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






export default router;
