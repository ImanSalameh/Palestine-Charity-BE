import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import postsRoutes from './routes/posts';
import { User } from './models/Users';
import cors from 'cors';
const app = express();
const port=3000;
// Import routes
app.use(express.json()); // Use built-in JSON parsing middleware
const corsOptions = {
  origin: 'http://localhost:4200',
};

app.use(cors(corsOptions));
app.use('/posts', postsRoutes);

// MongoDB connection URI 
const mongoURI = 'mongodb+srv://imansalameh:iman2002@cluster1.xttal40.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
    
    // Define additional routes
     // Define route to update user role
     app.get('/updateUserRole', async (req: Request, res: Response) => {
      try {
        // Find the user with the specified email
        const user = await User.findOne({ Email: 'Mohammadshair@gmail.com' });

        if (user) {
          // Update the user's role to "admin"
          user.Role = 'admin';
          await user.save();
          console.log('User role updated to admin successfully');
          res.send('User role updated to admin successfully');
        } else {
          console.log('User not found');
          res.send('User not found');
        }
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send('Internal server error');
      }
    });

    // Start the Express server after MongoDB connection is established
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process if there's an error
  });

console.log("hi!!");
