import {Request, Response, Router} from "express";
import {Influencer, IUser, Organization, User} from '../models/Users';
import {Donation} from "../models/donation";



const router = Router();

router.get('/organization/campaigns/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        const organization = await Organization.findById(userId).populate("campaigns")

        if(!organization){
            return res.status(404).json({ message: 'User not found' });
        }
        if(organization.Role !== 'Organization'){
            return res.status(403).json({ message: 'User is not an organization' });
        }
        res.status(200).json({campaigns: organization.campaigns})
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/influencer/campaigns/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        const influencer = await Influencer.findById(userId).populate("campaigns")

        if(!influencer){
            return res.status(404).json({ message: 'User not found' });
        }
        if(influencer.Role !== 'Organization'){
            return res.status(403).json({ message: 'User is not an organization' });
        }
        res.status(200).json({campaigns: influencer.campaigns})
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/user/:userId/activate', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { activated } = req.body;

        if (typeof activated !== 'boolean') {
            return res.status(400).json({ message: 'Invalid activation status' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { activated },
            { new: true } // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User activation status updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;