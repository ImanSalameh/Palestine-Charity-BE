import express, { Router, Request, Response } from 'express';
import { IUser, User } from '../models/Users';
import shopItems from '../models/shopItem';

const router = Router();

// Get Fonts
router.get('/fonts', (req: Request, res: Response) => {
    const fonts = shopItems.filter(item => item.type === 'font');
    res.json(fonts);
});

// Get Profile Pictures
router.get('/profile-pictures', (req: Request, res: Response) => {
    const profilePictures = shopItems.filter(item => item.type === 'picture');
    res.json(profilePictures);
});

// Get Backgrounds
router.get('/background', (req: Request, res: Response) => {
    const backgrounds = shopItems.filter(item => item.type === 'background');
    res.json(backgrounds);
});

// Get Borders
router.get('/borders', (req: Request, res: Response) => {
    const borders = shopItems.filter(item => item.type === 'border');
    res.json(borders);
});

// Define API endpoint for purchasing items
router.post('/buyItem', async (req: Request, res: Response) => {
    try {
        const { userId, itemId } = req.body;

        // Retrieve user from database
        const user = await User.findById(userId) as IUser;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user has already bought the selected item
        if (user.purchasedItems.includes(itemId)) {
            return res.status(400).json({ message: 'You have already purchased this item' });
        }

        // Retrieve item from shop items
        const item = shopItems.find(item => item.id === itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if user has enough tokens to purchase the item
        if (user.token < item.price) {
            return res.status(400).json({ message: 'Not enough tokens to purchase this item' });
        }

        // Deduct tokens from user's balance
        user.token -= item.price;

        // Add the item ID to the user's purchased items
        user.purchasedItems.push(itemId);

        // Save updated user to database
        await user.save();

        // Construct response data
        const responseData = {
            message: 'Item purchased successfully',
            user: {
                _id: user._id,
                Name: user.Name,
                token: user.token,
                purchasedItems: user.purchasedItems
            },
            item: {
                id: item.id,
                name: item.name,
                type: item.type,
                price: item.price
            }
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error purchasing item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Helper function to get purchased items by type
const getPurchasedItemsByType = (user: IUser, type: string) => {
    return shopItems.filter(item => item.type === type && user.purchasedItems.includes(item.id));
};

// Get Fonts purchased by the user
router.get('/user/:userId/fonts', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId) as IUser;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const boughtFonts = getPurchasedItemsByType(user, 'font');

        res.status(200).json(boughtFonts);
    } catch (error) {
        console.error('Error retrieving fonts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Profile Pictures purchased by the user
router.get('/user/:userId/profile-pictures', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId) as IUser;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const boughtProfilePictures = getPurchasedItemsByType(user, 'picture');

        res.status(200).json(boughtProfilePictures);
    } catch (error) {
        console.error('Error retrieving profile pictures:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Backgrounds purchased by the user
router.get('/user/:userId/backgrounds', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId) as IUser;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const boughtBackgrounds = getPurchasedItemsByType(user, 'background');

        res.status(200).json(boughtBackgrounds);
    } catch (error) {
        console.error('Error retrieving backgrounds:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Borders purchased by the user
router.get('/user/:userId/borders', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId) as IUser;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const boughtBorders = getPurchasedItemsByType(user, 'border');

        res.status(200).json(boughtBorders);
    } catch (error) {
        console.error('Error retrieving borders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
