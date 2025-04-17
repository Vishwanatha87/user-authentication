import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./utils/db.js";
import cookieParser from "cookie-parser";
// import routes

import userRoute from "./routes/user.route.js";


dotenv.config();
const port = process.env.PORT || 3000;

// initialize express app
const app = express();

// middleware
app.use(
  cors({
    origin: process.env.BASE_URL,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())



// routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/vishwa", (req, res) => {
  res.send("Vishwa is on fire");
});

// connect to db
db();

// user routes
app.use("/api/v1/users/", userRoute);

// server listening
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
