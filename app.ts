import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from './models/Users';
import * as dotenv from 'dotenv';
import { cloudinary } from './cloudinary';

// Import separate route files
import postsRoutes from './routes/posts';
import campaignRoutes from './routes/campaignRoutes';
import authRoutes from './routes/authRoutes';
import badgeRoutes from './routes/badgeRoutes';
import donationRoutes from './routes/donationRoutes';
import userRouts from './routes/userRoutes';
import shopRouts from './routes/shopRoutes';
import rolesRoutes from "./routes/rolesRoutes";

import cors from 'cors';
import mailRoutes from "./routes/mailRoutes";

dotenv.config();
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
    app.use('/posts', campaignRoutes);
    app.use('/posts', authRoutes);
    app.use('/posts', badgeRoutes);
    app.use('/posts', donationRoutes);
    app.use('/posts', userRouts);
    app.use('/posts', shopRouts);
    app.use('/posts', rolesRoutes);
    app.use('/api', mailRoutes)


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
