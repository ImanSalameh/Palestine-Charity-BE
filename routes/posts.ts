import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/Users';
import { sign } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ICampaign, Campaign } from '../models/campaigns';
import { Donation } from '../models/donation';
import { IBadge, Badge } from '../models/badge';
import { IDonor, Donor } from '../models/Users';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { Name, Email, Password, Age, PhoneNumber, Address, Badges, Token, favorite, Role } = req.body;

        // Check if email field is provided
        if (!Email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user with the same email already exists
        const existingUser: IUser | null = await User.findOne({ Email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this Email' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(Password, 10);


        const newUser: IUser = new User({
            Name,
            Email,
            Password: hashedPassword,
            Age,
            PhoneNumber,
            Address,
            Badges,
            Token,
            favorite,
            Role,
            Donationrecords: [] // Initialize as an empty array
        });

        // Save the user to the database
        const savedUser = await newUser.save();

        // Generate a token for the user
        const token = sign({ userId: savedUser._id }, 'your_secret_key', { expiresIn: '1h' });

        // Include the auto-generated _id and token in the response
        res.status(201).json({
            message: 'User registered successfully',

        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});





// Login route
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { Email, Password } = req.body;

        // Check if user exists with the provided email
        const user: IUser | null = await User.findOne({ Email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(Password, user.Password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate a token for the user
        const token = sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
        const userId = req.params.userId;
        const donations = await Donation.find({ user: userId });

        // Include all user data and the token in the response
        res.status(200).json({
            user: {
                _id: user._id.toString(),
                Name: user.Name,
                Email: user.Email,
                Age: user.Age,
                PhoneNumber: user.PhoneNumber,
                Address: user.Address,
                Badges: user.Badges,
                Token: user.token,
                favorite: user.favorite,
                Role: user.Role,
                Donationrecords: donations

            },

        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






// Campaign Add route
router.post('/addcamp', async (req: Request, res: Response) => {
    try {
        const { campaignName, campaignImage, organizationName, currentAmount, goalAmount, status, startDate, endDate, description, usre_id } = req.body;

        // Create new campaign
        const newCampaign: ICampaign = new Campaign({
            campaignName,
            campaignImage,
            organizationName,
            currentAmount,
            goalAmount,
            status,
            startDate,
            endDate,
            description
        });

        // Save the campaign to the database
        const savedCampaign = await newCampaign.save();

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







// Route to get donations for a specific user
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        // Find the user by ID and populate the badges field
        const user = await User.findById(userId).populate('Badges');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find donations for the specified user and populate the campaign field with the campaign object
        const donations = await Donation.find({ user: userId })
            .populate({
                path: 'campaign',
                select: '-leaderboard' // Exclude the leaderboard field from the populated campaign object
            });

        // Construct the response object containing user information and donations
        const responseData = {
            user: {
                _id: user._id,
                Name: user.Name,
                Address: user.Address,
                Age: user.Age,
                Email: user.Email,
                token: user.token,
                Badges: user.Badges,
                favorite: user.favorite,
                PhoneNumber: user.PhoneNumber,
                Role: user.Role,
                Donationrecords: donations
            },
            //donations
        };

        // Send the response
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error retrieving donations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






//pagination
router.get('/campaigns', async (req, res) => {
    try {
        let page: number = parseInt(req.query.page as string, 10);
        if (isNaN(page) || page < 1) {
            page = 1;
        }

        let pageSize = parseInt(req.query.limit as string, 10)

        if (isNaN(pageSize) || pageSize < 1) {
            pageSize = 10;
        }
        const skip = (page - 1) * pageSize; //This calculates how many items to skip in order to reach the desired page

        // Fetch campaigns for the specified page
        const campaigns = await Campaign.find()
            .skip(skip)
            .limit(pageSize);

        if (campaigns.length === 0 && page > 1) { //This condition checks if there are no campaigns found for the requested page. the number of page requested is greater than 1 and there is no more campaigns
            return res.status(404).json({ message: 'Page not found' });
        }

        res.status(200).json({
            campaigns,
            currentPage: page
        });
    } catch (error) {
        console.error('Error retrieving campaigns:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});





// route for fetching user tokens
router.get('/tokens/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;


        // Retrieve the user from the database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Retrieve the user's donations from the database
        const donations = await Donation.find({ user: userId });

        // Calculate the total tokens that earned from donations
        let totalTokens = 0;
        for (const donation of donations) {
            totalTokens += donation.tokens || 0;
        }

        // Return the total tokens earned
        res.status(200).json({ userId, userName: user.Name, totalTokens });
    } catch (error) {
        console.error('Error retrieving user tokens:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// Route to make a donation
router.post('/donate', async (req: Request, res: Response) => {
    try {
        const { userId, campaignId, amount } = req.body;

        // Create a new donation
        const newDonation = new Donation({
            user: userId,
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

        // Calculate tokens earned based on donation amount
        const tokensEarned = amount * 10;

        // Update the user's token balance
        await User.findByIdAndUpdate(userId, { $inc: { token: tokensEarned } });

        // Update the user's donation records
        const user: IUser | null = await User.findById(userId);
        if (user) {
            user.Donationrecords.push(savedDonation._id);
            await user.save();

            // Check and award badges to the user
            await checkAndAwardBadges(userId, user.token); // Assuming token is the field storing user's tokens
        }

        res.status(201).json({ message: 'Donation made successfully', donation: savedDonation });
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








//  to handle donation and update the leaderboard for a campaign
router.get('/campaign/:campaignId', async (req, res) => {
    try {
        const campaignId = req.params.campaignId;

        // Find the campaign by ID
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Retrieve donations for the campaign with specified fields from user
        const donations = await Donation.find({ campaign: campaignId })
            .populate({
                path: 'user',
                select: 'Name Address Email Role' // Specify the fields I want to retrieve
            });

        // Get the leaderboard for the campaign
        const leaderboardResult = await getCampaignLeaderboard(campaignId);
        if (leaderboardResult.error) {
            return res.status(500).json({ message: 'Error fetching leaderboard: ' + leaderboardResult.error });
        }

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

            // Populate user names based on user IDs
            const user = await User.findById(userId);
            if (user) {
                leaderboard.push({ userId, userName: user.Name, amountDonated });
            }
        }

        return { leaderboard };
    } catch (error) {
        console.error('Error fetching campaign leaderboard:', error);
        return { error: 'Internal server error' };
    }
}





// Define route for donation rate by address
router.get('/chart', async (req, res) => {
    try {
        // Fetch all donation records for all users
        const donationRecords = await User.aggregate([
            {
                $unwind: "$Donationrecords" // Expand Donationrecords array
            },
            {
                $lookup: {
                    from: "donations", // Collection name
                    localField: "Donationrecords",
                    foreignField: "_id",
                    as: "donationDetails"
                }
            },
            {
                $unwind: "$donationDetails" // Expand donationDetails array
            },
            {
                $group: {
                    _id: { address: "$Address" }, // Group by address
                    totalDonation: { $sum: "$donationDetails.amount" }
                }
            },
            {
                $group: {
                    _id: null, // Group all documents together
                    totalDonationAllPlaces: { $sum: "$totalDonation" }, // Calculate total donation in all places
                    places: {
                        $push: {
                            address: "$_id.address",
                            totalDonation: "$totalDonation"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field from results
                    totalDonationAllPlaces: 1, // Include total donation for all places
                    places: {
                        $map: {
                            input: "$places",
                            as: "place",
                            in: {
                                address: "$$place.address",
                                totalDonation: "$$place.totalDonation",
                                donationRate: {
                                    $multiply: [
                                        { $divide: ["$$place.totalDonation", "$totalDonationAllPlaces"] },
                                        100 // Convert to percentage
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        if (donationRecords.length === 0) {
            console.log("No donation records found.");
            return res.status(404).json({ message: "No donation records found." });
        }

        // Log the total donation for all places to the console
        console.log("Total Donation for All Places:", donationRecords[0].totalDonationAllPlaces);

        // Return the donation rate by address including total donation for all places
        res.json({
            totalDonationAllPlaces: donationRecords[0].totalDonationAllPlaces,
            places: donationRecords[0].places
        });
    } catch (error) {
        console.error('Error fetching donation rate by address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




export default router;

console.log("have a nice day!")









/*

// Define route for donation rate by address
router.get('/chart', async (req, res) => {
    try {
        // Fetch all donation records for all users
        const donationRecords = await User.aggregate([
            {
                $unwind: "$Donationrecords" // Expand Donationrecords array
            },
            {
                $lookup: {
                    from: "donations", // Collection name
                    localField: "Donationrecords",
                    foreignField: "_id",
                    as: "donationDetails"
                }
            },
            {
                $unwind: "$donationDetails" // Expand donationDetails array
            },
            {
                $group: {
                    _id: { address: "$Address" }, // Group by address
                    totalDonation: { $sum: "$donationDetails.amount" }
                }
            },
            {
                $group: {
                    _id: null, // Group all documents together
                    totalDonationAllPlaces: { $sum: "$totalDonation" }, // Calculate total donation in all places
                    places: {
                        $push: {
                            address: "$_id.address",
                            totalDonation: "$totalDonation"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field from results
                    totalDonationAllPlaces: 1, // Include total donation for all places
                    places: {
                        $map: {
                            input: "$places",
                            as: "place",
                            in: {
                                address: "$$place.address",
                                totalDonation: "$$place.totalDonation",
                                donationRate: {
                                    $multiply: [
                                        { $divide: ["$$place.totalDonation", "$totalDonationAllPlaces"] },
                                        100 // Convert to percentage
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        if (donationRecords.length === 0) {
            console.log("No donation records found.");
            return res.status(404).json({ message: "No donation records found." });
        }

        // Log the total donation for all places to the console
        console.log("Total Donation for All Places:", donationRecords[0].totalDonationAllPlaces);

        // Return the donation rate by address including total donation for all places
        res.json({
            totalDonationAllPlaces: donationRecords[0].totalDonationAllPlaces,
            places: donationRecords[0].places
        });
    } catch (error) {
        console.error('Error fetching donation rate by address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






// Define route for donation rate by address
router.get('/chart', async (req, res) => {
    try {
        // Fetch all donation records for all users
        const donationRecords = await User.aggregate([
            {
                $unwind: "$Donationrecords" // Expand Donationrecords array
            },
            {
                $lookup: {
                    from: "donations", // Collection name
                    localField: "Donationrecords",
                    foreignField: "_id",
                    as: "donationDetails"
                }
            },
            {
                $unwind: "$donationDetails" // Expand donationDetails array
            },
            {
                $group: {
                    _id: { address: "$Address", user: "$_id" }, // Group by address and user
                    totalDonation: { $sum: "$donationDetails.amount" }
                }
            },
            {
                $group: {
                    _id: "$_id.address", // Group by address only
                    totalDonation: { $sum: "$totalDonation" },
                    numUsers: { $sum: 1 } // Count the number of users in each address
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field from results
                    address: "$_id",
                    totalDonation: 1,
                    donationRate: { $divide: ["$totalDonation", "$numUsers"] } // Calculate donation rate per user in the same address
                }
            }
        ]);

        // Return the donation rate by address
        res.json(donationRecords);
    } catch (error) {
        console.error('Error fetching donation rate by address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Define route for campaign donation rates
router.get('/campaign-donation-rates', async (req, res) => {
    try {
        // Fetch all campaigns
        const campaigns = await Campaign.find();

        // Calculate total donation for all campaigns
        const totalAllCampaigns = campaigns.reduce((total, campaign) => total + campaign.currentAmount, 0);

        // Calculate donation rate for each campaign
        const donationRates = campaigns.map(campaign => ({
            campaignId: campaign._id,
            campaignName: campaign.campaignName,
            donationRate: (campaign.currentAmount / totalAllCampaigns) * 100
        }));

        // Return the campaign donation rates
        res.json(donationRates);
    } catch (error) {
        console.error('Error fetching campaign donation rates:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






// Function to add a campaign to user's favorites
async function addFavoriteCampaign(userId: string, campaign: ICampaign) {
    try {
        const user = await User.findById(userId);

        if (!user) {
            console.error('User not found');
            return;
        }

        // Ensure user.favorite is recognized as an array of ICampaign objects
        if ((user as IUser).favorite instanceof Array) {
            (user as IUser).favorite.push(campaign);
            await user.save();

            console.log(`Campaign added to favorites for user ${userId}`);
        } else {
            console.error('User favorite is not an array');
        }
    } catch (error) {
        console.error('Error adding campaign to favorites:', error);
    }
}

// Function to remove a campaign from user's favorites
async function removeFavoriteCampaign(userId: string, campaignId: string) {
    try {
        const user = await User.findById(userId);

        if (!user) {
            console.error('User not found');
            return;
        }

        // Ensure user.favorite is recognized as an array of ICampaign objects
        if ((user as IUser).favorite instanceof Array) {
            (user as IUser).favorite = (user as IUser).favorite.filter((campaign: ICampaign) => campaign._id !== campaignId);
            await user.save();

            console.log(`Campaign removed from favorites for user ${userId}`);
        } else {
            console.error('User favorite is not an array');
        }
    } catch (error) {
        console.error('Error removing campaign from favorites:', error);
    }
}



router.post('/creatBadge', async (req: Request, res: Response) => {
    try {

        const { userId, picture, description } = req.body;

        // Create a new badge document
        const newBadge = new Badge({
            user: userId,
            picture,
            description
        });

        // Save the badge to the database
        const savedBadge = await newBadge.save();

        res.status(201).json({ message: 'Badge awarded successfully', badge: savedBadge });
    } catch (error) {
        console.error('Error awarding badge:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Campaign get route
router.get('/', async (req: Request, res: Response) => {
    try {
        // Query all campaigns from the database
        const campaigns = await Campaign.find();

        res.status(200).json({ campaigns });
    } catch (error) {
        console.error('Error retrieving campaigns:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

*/