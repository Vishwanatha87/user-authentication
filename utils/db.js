import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();


// function to connect to mongodb database
const db = async () =>{
    await mongoose.connect(process.env.MONGO_URI)
    .then(() =>{
        console.log("Database connected");
    })
    .catch((err) =>{
        console.log(`Failed to connect to the database ${err}`);
    })
}

export default db;