import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema({

    name: String,
    email: String,
    password: String,
    role:{
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
    isVerified:{
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpires: Date,
    

},{timestamps: true});

// hooks for pre and post save
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10)
    }
    next()
})




const User = mongoose.model("User", userSchema);

export default User;
