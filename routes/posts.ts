import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/Users';
import { sign } from 'jsonwebtoken';

import { ICampaign, Campaign } from '../models/campaigns';
import { Donation } from '../models/donation';

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
                Role: user.Role

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
        // Query all campaigns from the database
        const campaigns = await Campaign.find();

        res.status(200).json({ campaigns });
    } catch (error) {
        console.error('Error retrieving campaigns:', error);
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
        }

        res.status(201).json({ message: 'Donation made successfully', donation: savedDonation });
    } catch (error) {
        console.error('Error making donation:', error);
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
        res.status(200).json({ userId, totalTokens });
    } catch (error) {
        console.error('Error retrieving user tokens:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});





// Route to get donations for a specific user
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find donations for the specified user and populate the campaign field with the campaign object
        const donations = await Donation.find({ user: userId }).populate('campaign');

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
                Donationrecords: [donations]
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






// Route to get donations for a specific campaign
router.get('/campaign/:campaignId', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.campaignId;

        // Find the campaign by ID
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }


        const donations = await Donation.find({ campaign: campaignId }).populate('user');


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
                description: campaign.description

            },
            donations
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





export default router;

console.log("yyyyyyyyyyyyayyyy")

