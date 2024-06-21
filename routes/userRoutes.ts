// userRoutes.ts
import { Router, Request, Response } from 'express';
import { IUser, User } from '../models/Users';
import { Donation } from '../models/donation';
import {cloudinary} from "../cloudinary";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({});

const upload = multer({ storage });

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
                profilePicture: user.profilePicture,
                biography: user.biography,
                backgroundPicture: user.backgroundPicture,
                Address: user.Address,
                Age: user.Age,
                Email: user.Email,
                token: user.token,
                Badges: user.Badges,
                favorite: user.favorite,
                PhoneNumber: user.PhoneNumber,
                font: user.font,
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

router.put('/updateProfilePicture', upload.single('profilePicture'), async (req, res: Response) => {
    try {
        const userId = req.body.userId as string; // Or however you get the user ID
        let profilePictureUrl: string | undefined;

        if (req.file) {
            // File upload logic
            const result = await cloudinary.uploader.upload(req.file.path);
            profilePictureUrl = result.secure_url;
        } else if (req.body.profilePictureUrl) {
            // URL string logic
            profilePictureUrl = req.body.profilePictureUrl;
        } else {
            return res.status(400).json({ error: 'Bad request: No file or URL provided' });
        }

        // Update user profile picture
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.profilePicture = profilePictureUrl!;
        await user.save();

        res.json({ message: 'Profile picture updated successfully', profilePicture: profilePictureUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/updateBackgroundPicture', upload.single('backgroundPicture'), async (req, res: Response) => {
    try {
        const userId = req.body.userId as string; // Or however you get the user ID
        let backgroundPictureUrl: string | undefined;

        if (req.file) {
            // File upload logic
            const result = await cloudinary.uploader.upload(req.file.path);
            backgroundPictureUrl = result.secure_url;
        } else if (req.body.backgroundPictureUrl) {
            // URL string logic
            backgroundPictureUrl = req.body.backgroundPictureUrl;
        } else {
            return res.status(400).json({ error: 'Bad request: No file or URL provided' });
        }

        // Update user background picture
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.backgroundPicture = backgroundPictureUrl!;
        await user.save();

        res.json({ message: 'Background picture updated successfully', backgroundPicture: backgroundPictureUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id/biography', async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { biography } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { biography },
            { new: true }
        );

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.send(user);
    } catch (error) {
        res.status(500).send({ message: (error as Error).message });
    }
});

router.put('/:userId/font', async (req, res) => {
    const { userId } = req.params;
    const { font } = req.body; // Assuming font is sent in the request body

    try {
        const user = await User.findByIdAndUpdate(userId, { $set: { font } }, { new: true }); // Update font and return updated user
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.send(user); // Send the updated user object
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

export default router;