import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/Users';
import { sign } from 'jsonwebtoken';

import { ICampaign, Campaign } from '../models/campaigns';
import { Donation } from '../models/donation';

const router = Router();

// Register route
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { Name, Email, Password, Age, PhoneNumber, Address } = req.body;

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

        // Create new user without specifying UserID
        const newUser: IUser = new User({
            Name,
            Email,
            Password: hashedPassword,
            Age,
            PhoneNumber,
            Address
        });

        // Save the user to the database
        const savedUser = await newUser.save();

        // Generate a token for the user
        const token = sign({ userId: savedUser._id }, 'your_secret_key', { expiresIn: '1h' });

        // Include the auto-generated _id and token in the response
        res.status(201).json({
            message: 'User registered successfully'
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

        // Find donations for the specified user
        const donations = await Donation.find({ user: userId }).populate('campaign');

        res.status(200).json({ donations });
    } catch (error) {
        console.error('Error retrieving donations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to get donations for a specific campaign
router.get('/campaign/:campaignId', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.campaignId;

        // Find donations for the specified campaign
        const donations = await Donation.find({ campaign: campaignId }).populate('user');

        res.status(200).json({ donations });
    } catch (error) {
        console.error('Error retrieving donations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

