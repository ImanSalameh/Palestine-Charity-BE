// campaignRoutes.ts

import {Router, Request, Response, NextFunction} from 'express';
import {IUser, Organization, User} from '../models/Users';
import mongoose from 'mongoose';
import { ICampaign, Campaign } from '../models/campaigns';
import { Donation } from '../models/donation';
import multer from "multer";
import {cloudinary} from "../cloudinary";

const router = Router();

const storage = multer.diskStorage({});

const upload = multer({ storage });


router.post('/upload', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);

        // If successful, return Cloudinary URL of the uploaded image
        res.status(200).json({ imageUrl: result.secure_url });
    } catch (error) {
        next(error);
    }
});

// Campaign Add route

router.post('/addcamp', upload.single('image'), async (req: Request, res: Response) => {
    try {
        const { campaignName, userId, currentAmount, goalAmount, status, startDate, endDate, description } = req.body;

        // Check if image file exists
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);

        // Trim and cast the userId to ObjectId
        const trimmedUserId = userId.trim();
        const objectId = new mongoose.Types.ObjectId(trimmedUserId);

        // Find the organization by userId
        const organization = await Organization.findOne({ _id: objectId, Role: 'Organization' });
        console.log('Trimmed UserID:', trimmedUserId);
        console.log('ObjectID:', objectId);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Create the new campaign
        const newCampaign: ICampaign = new Campaign({
            campaignName,
            campaignImage: result.secure_url,
            organizationName: organization.Name,
            currentAmount,
            goalAmount,
            status,
            startDate,
            endDate,
            description
        });

        // Save the new campaign
        const savedCampaign = await newCampaign.save();

        // Add the campaign to the organization's campaigns array
        organization.campaigns.push(savedCampaign._id);

        // Save the organization
        await organization.save();



        res.status(201).json({ message: 'Campaign added successfully' });
    } catch (error) {
        console.error('Error adding campaign:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Campaign get route
router.get('/', async (req: Request, res: Response) => {
    try {
        // Query all campaigns from the database, excluding the leaderboard field
        const campaigns = await Campaign.find({}, '-leaderboard');

        res.status(200).json({ campaigns });


    } catch (error) {
        console.error('Error retrieving campaigns:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/campaign/:campaignId', async (req, res) => {
    try {
        const campaignId = req.params.campaignId;

        // Find the campaign by ID
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Retrieve donations for the campaign with specified fields from user
        let donations = await Donation.find({ campaign: campaignId })
            .populate({
                path: 'user',
                select: 'Name Address Email Role' // Specify the fields I want to retrieve
            });

        // Get the leaderboard for the campaign
        const leaderboardResult = await getCampaignLeaderboard(campaignId);
        if (leaderboardResult.error) {
            return res.status(500).json({ message: 'Error fetching leaderboard: ' + leaderboardResult.error });
        }

        // Add identifier for anonymous donations
        donations = donations.map(donation => ({
            ...donation.toObject(),
            isAnonymous: donation.user === 'Anonymous' // Add a flag to identify anonymous donations
        }));

        const responseData = {
            campaign: {
                _id: campaign._id,
                campaignName: campaign.campaignName,
                campaignImage: campaign.campaignImage,
                organizationName: campaign.organizationName,
                currentAmount: campaign.currentAmount,
                goalAmount: campaign.goalAmount,
                status: campaign.status,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                description: campaign.description,
                newsDashboard: campaign.newsDashboard,
                leaderboard: leaderboardResult.leaderboard
            },
            donations
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error handling donation and updating leaderboard:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Route to get the leaderboard for a specific campaign
router.get('/:campaignId/leaderboard', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.campaignId;
        const result = await getCampaignLeaderboard(campaignId);
        if (result.error) {
            return res.status(404).json({ message: result.error });
        }
        res.status(200).json(result);
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


async function getCampaignLeaderboard(campaignId: string) {
    try {
        // Fetch the campaign document
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return { error: 'Campaign not found' };
        }

        // Query donation records for the campaign
        const donationRecords = await Donation.aggregate([
            { $match: { campaign: mongoose.Types.ObjectId.createFromHexString(campaignId) } },
            { $group: { _id: "$user", totalDonation: { $sum: "$amount" } } },
            { $sort: { totalDonation: -1 } },
            { $limit: 10 } // Limit to top 3 donors
        ]);

        // Extract user IDs and total donation amounts from donation records
        const leaderboard = [];
        for (const donationRecord of donationRecords) {
            const userId = donationRecord._id;
            const amountDonated = donationRecord.totalDonation;

            // Skip anonymous donations
            if (userId !== 'Anonymous') {
                // Populate usernames based on user IDs
                const user = await User.findById(userId);
                if (user) {
                    leaderboard.push({ userId, userName: user.Name, amountDonated });
                }
            }
        }

        return { leaderboard };
    } catch (error) {
        console.error('Error fetching campaign leaderboard:', error);
        return { error: 'Internal server error' };
    }
}





//to get all favorite campaigns of a user
router.get('/favorite-campaigns/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId).populate('favorite');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure user.favorite is recognized as an array of ICampaign objects
        if (user.favorite instanceof Array) {
            const favoriteCampaigns: ICampaign[] = user.favorite;
            return res.status(200).json({ favoriteCampaigns });
        } else {
            return res.status(500).json({ message: 'User favorite is not an array' });
        }
    } catch (error) {
        console.error('Error getting favorite campaigns:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


//adding favorit campaign
router.post('/add-favorite', async (req: Request, res: Response) => {
    try {
        const { userId, campaignId } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the campaign by ID
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Check if the campaign already exists in the user's favorites
        if (user.favorite.some(favorite => favorite.equals(campaign._id))) {
            return res.status(400).json({ message: 'Campaign already exists in favorites' });
        }

        // Add the campaign object to the user's favorite campaigns array
        user.favorite.push(campaign);

        // Save the user document
        await user.save();

        res.status(200).json({ message: 'Campaign added to favorites successfully' });
    } catch (error) {
        console.error('Error adding campaign to favorites:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.delete('/remove-favorite/:userId/:campaignId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const campaignId = req.params.campaignId;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Debug logging
        console.log('User favorite campaigns:', user.favorite);
        console.log('Campaign ID to remove:', campaignId);

        // Check if the campaign is in the user's favorites
        const index = user.favorite.findIndex((campaign: ICampaign) => campaign._id.toString() === campaignId);

        if (index === -1) {
            return res.status(404).json({ message: 'Campaign not found in user favorites' });
        }

        // Remove the campaign from the favorites array
        user.favorite.splice(index, 1);

        // Save the updated user object
        await user.save();

        return res.status(200).json({ message: 'Campaign removed from favorites successfully' });
    } catch (error) {
        console.error('Error removing campaign from favorites:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/campaigns/search/:name', async (req: Request, res: Response) => {
    const { name } = req.params;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Invalid search query' });
    }

    try {
        const results = await Campaign.find({ campaignName: { $regex: new RegExp(name, 'i') } });
        res.json(results);
    } catch (error) {
        console.error('Error searching campaigns:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/campaigns/:campaignId/news', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.campaignId;
        const news = req.body.news; // Assuming the request body contains a 'news' field

        if (!news) {
            return res.status(400).json({ message: 'News content is required' });
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            campaignId,
            { $push: { newsDashboard: news } },
            { new: true } // Return the updated document
        );

        if (!updatedCampaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        res.status(201).json(updatedCampaign.newsDashboard);
    } catch (error) {
        console.error('Error adding news to campaign:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/campaigns/:campaignId/news/:index', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.campaignId;
        const index = parseInt(req.params.index); // Convert index to a number

        // Find the campaign
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Check if the index is valid
        if (index < 0 || index >= campaign.newsDashboard.length) {
            return res.status(400).json({ message: 'Invalid index' });
        }

        // Remove the news item at the specified index
        campaign.newsDashboard.splice(index, 1);

        // Save the updated campaign
        await campaign.save();

        res.json(campaign.newsDashboard);
    } catch (error) {
        console.error('Error deleting news from campaign:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});;


export default router;
