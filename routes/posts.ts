import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/Users';

const router = Router();

// Register route
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { Name, Email, Password, Age, PhoneNumber, Address} = req.body;
        
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

        // Create new user
        const newUser: IUser = new User({
            Name,
            Email,
            Password: hashedPassword,
            Age,
            PhoneNumber,
            Address
        });

        // Save the user to the database
        await newUser.save();


        // Include the auto-generated _id in the response
        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                _id: newUser._id, // Include the _id in the response
                Name: newUser.Name,
                Email: newUser.Email,
                Age: newUser.Age,
                PhoneNumber: newUser.PhoneNumber,
                Address: newUser.Address,
                Role: newUser.Role
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Login route
// Login route
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { Email, Password } = req.body;

        // Check if user exists with the provided email
        const user: IUser | null = await User.findOne({ Email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password is provided
        if (!Password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // Check if the user's password is provided
        if (!user.Password) {
            return res.status(500).json({ message: 'User password is missing' });
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(Password, user.Password);

        // Convert the ObjectId to a string
        const userIdString = user._id.toString();

        // Include all user data in the response, including the UserID
        res.status(200).json({ 
            user: {
                _id: userIdString, // Include the _id in the response as a string
                Name: user.Name,
                Email: user.Email,
                Age: user.Age,
                PhoneNumber: user.PhoneNumber,
                Address: user.Address,
                Role: user.Role
                // Add more fields if needed
            }
        });

    } catch (error) {
        console.error('Error logging in:', error);
        // Return the user's _id even if there's an error
        if (user) {
            const userIdString = user._id.toString();
            return res.status(500).json({ message: 'Internal server error', _id: userIdString });
        } else {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
});


export default router;