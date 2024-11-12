import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const dbUrl = process.env.DB_URL;

const start = async () => {
  try {
    const connectionDb = await mongoose.connect(dbUrl);

    console.log(`Mongo Connected DB Host: ${connectionDb.connection.host}`);
    server.listen(app.get("port"), () => {
      console.log("Listening to port", app.get("port"));
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

start();
