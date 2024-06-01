import { Router, Request, Response } from 'express';
import { IUser, User } from '../models/Users';
import { ICampaign, Campaign } from '../models/campaigns';
import shopItems from '../models/shopItem';


const router = Router();



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




// Define API endpoint for purchasing items
router.post('/buyItem', async (req, res) => {
    try {
        const userId = req.body.userId;
        const itemId = req.body.itemId;
        const selectedOption = req.body.selectedOption; // Chosen option from the array

        // Retrieve user from database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Retrieve item from shop items
        const item = shopItems.find(item => item.id === itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if selected option is valid for the item
        if (!item.options.includes(selectedOption)) {
            return res.status(400).json({ message: 'Invalid option selected' });
        }

        // Check if user has enough tokens to purchase the item
        if (user.token < item.price) {
            return res.status(400).json({ message: 'Not enough tokens to purchase this item' });
        }

        // Deduct tokens from user's balance
        user.token -= item.price;


        // Save updated user to database
        await user.save();

        res.status(200).json({ message: 'Item purchased successfully', user });
    } catch (error) {
        console.error('Error purchasing item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

console.log("have a nice day!")

