import {Router, Request, Response, NextFunction} from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/Users';
import { sign } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ICampaign, Campaign } from '../models/campaigns';
import { Donation } from '../models/donation';
import { IBadge, Badge } from '../models/badge';
import { IDonor, Donor } from '../models/Users';
import {cloudinary} from "../cloudinary";
import multer from "multer";

const router = Router();


const storage = multer.diskStorage({});

const upload = multer({ storage });

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
router.post('/addcamp', upload.single('image'), async (req: Request, res: Response) => {
    try {
        const { campaignName, organizationName, currentAmount, goalAmount, status, startDate, endDate, description} = req.body;

        // Check if image file exists
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const result = await cloudinary.uploader.upload(req.file.path);

        const newCampaign: ICampaign = new Campaign({
            campaignName,
            campaignImage: result.secure_url,
            organizationName,
            currentAmount,
            goalAmount,
            status,
            startDate,
            endDate,
            description
        });

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
export default router;

console.log("yyyyyyyyyyyyayyyy")

