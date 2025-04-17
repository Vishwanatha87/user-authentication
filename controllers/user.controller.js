import User from "../models/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const registerUser = async (req, res) => {
  // get data, validate , check if user exists, create a user in database, create a verification token,
  //  save token in database, send token as email to user, send success status to user.

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide all the required fields",
    });
  }
  // more validations to include

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });
    console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not registered",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    console.log(token);
    user.verificationToken = token;
    await user.save();

    // send email token
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDER_EMAIL,
      to: user.email,
      subject: "Verify your email",
      text: `Please click on the below url to verify:
      ${process.env.BASE_URL}/api/v1/users/verify/${token}
      `,
      html: "<b>subscribe</b>",
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "User not registered ",
      error: error,
    });
  }
};

const verifyUser = async (req, res) => {
  // get token from url, validate token, find user based on token, make isverified true, remove verification token from database and return response.

  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Please provide a token",
    });
  }

  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid token",
    });
  }

  user.isVerified = true;
  user.verificationToken = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "User verified successfully",
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }

  try {
    const user = await User.findOne({email});
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    // check if the user is verified or not once password matches
    console.log(isMatch);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password or email not matching",
      });
    }

    const token = jwt.sign({ id: user._id }, "shhhhh", {expiresIn:'24h'});

    const cookieOption = {
      httpOnly: true,
      secure:true,
      maxAge: 86400
    }
    res.cookie('test',token, cookieOption)
    res.status(200).json({
      success:true,
      message:'Login successfull',
      token,
      user:{
        id:user._id,
        name:user.name,
        role:user.role,
        password:user.password
      }
    })
  } catch (error) {
    console.log(error);
    
    res.status(400).json({
      success: false,
      message: "User not registered ",
      error: error,
    });
    
  }
};

export { registerUser, verifyUser, loginUser };
