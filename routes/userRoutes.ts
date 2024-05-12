// userRoutes.ts
import { Router, Request, Response } from 'express';
import { IUser, User } from '../models/Users';
import { Donation } from '../models/donation';

const router = Router();



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
                Donationrecords: donations.map(donation => ({
                    _id: donation._id,
                    campaign: donation.campaign,
                    amount: donation.amount,
                    tokensEarned: donation.tokens, // Include tokens earned with each donation
                    donationDate: donation.donationDate
                }))
            }
        };

        // Send the response
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error retrieving donations:', error);
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

        // Retrieve the user's donations from the database, including anonymous donations
        const donations = await Donation.find({ $or: [{ user: userId }, { user: 'Anonymous' }] });

        // Calculate the total tokens earned, including tokens from anonymous donations
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

export default router;