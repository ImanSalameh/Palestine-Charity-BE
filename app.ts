import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from './models/Users';
import { Campaign } from './models/campaigns';
import postsRoutes from './routes/posts';
import campaignRoutes from './routes/posts'; // Correct import
import cors from 'cors';

const app = express();
const port = 3000;

// Middleware
app.use(express.json()); // Use built-in JSON parsing middleware
app.use(cors({ origin: 'http://localhost:4200' }));
app.use('/posts', postsRoutes);

// MongoDB connection URI 
const mongoURI = 'mongodb+srv://imansalameh:iman2002@cluster1.xttal40.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Use campaign routes
    app.use('/campaigns', campaignRoutes);

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process if there's an error
  });

console.log("Server started!");
