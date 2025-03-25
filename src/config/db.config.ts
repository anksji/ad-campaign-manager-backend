import mongoose from "mongoose";
import { environmentConfig } from "./env.variables.config";

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", false);

    const options = {
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maximum number of sockets kept open
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s inactivity
      family: 4, // Use IPv4, skip IPv6
    };

    await mongoose.connect(environmentConfig.MONGODB_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    console.log("MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
    process.exit(1);
  }
};
