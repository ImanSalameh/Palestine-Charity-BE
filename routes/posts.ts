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
        const { Name, Email, Password, Age, PhoneNumber, Address, Badges, Token, favorite, Role, Donationrecords } = req.body;
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
            user: savedUser // Optionally, you can return the saved user object in the response
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
                // Add more fields if needed
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
        const { campaignName, campaignImage, organizationName, goalAmount, status, startDate, endDate, description, usre_id } = req.body;

        // Create new campaign
        const newCampaign: ICampaign = new Campaign({
            campaignName,
            campaignImage,
            organizationName,
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
            amount
        });

        // Save the donation
        const savedDonation = await newDonation.save();

        res.status(201).json({ message: 'Donation made successfully', donation: savedDonation });
    } catch (error) {
        console.error('Error making donation:', error);
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
                goalAmount: campaign.goalAmount,
                status: campaign.status,
                startDate: campaign.startDate,
                endDate: campaign.endDate,

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
router.get('/campaigns/:page', async (req, res) => {
    try {
        const page = parseInt(req.params.page); // Extract page number from URL parameter
        const pageSize = 10; // Number of campaigns per page

        if (isNaN(page) || page < 1) {
            return res.status(400).json({ message: 'Invalid page number' });
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