import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import postsRoutes from './routes/posts';

const app = express();
const port = 6000;

// Import routes
app.use(express.json()); // Use built-in JSON parsing middleware
app.use('/posts', postsRoutes);

// MongoDB connection URI 
const mongoURI = 'mongodb+srv://imansalameh:iman2002@cluster1.xttal40.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
    
    // Define additional routes
    app.get('/', (req: Request, res: Response) => {
      res.send("we are on home");
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

console.log("hava a nice day!");
