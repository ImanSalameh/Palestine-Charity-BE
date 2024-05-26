// authRoutes.ts

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { IUser, User } from '../models/Users';
import { sign } from 'jsonwebtoken';
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
                //Donationrecords: donations

            },

        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



export default router;
