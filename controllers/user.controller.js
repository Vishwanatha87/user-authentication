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
      secure: false,
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
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verify Your Email</h2>
      <p>Please click the button below to verify your email address:</p>
      <a href="${process.env.BASE_URL}/api/v1/users/verify/${token}" 
         style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; 
                text-decoration: none; border-radius: 5px; margin-top: 10px;">
        Verify Email
      </a>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    </div>
  `,
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
    const user = await User.findOne({ email });
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      // expiresIn: "24h",
    });

    const cookieOption = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    res.cookie("token", token, cookieOption);
    res.status(200).json({
      success: true,
      message: "Login successfull",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        password: user.password,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(400).json({
      success: false,
      message: "User not registered ",
      error: error,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    console.log("reached here");

    const user = await User.findById(req.user.id).select(
      "-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordTokenExpires"
    );

    console.log(user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User found",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    // res.clearCookie("token", {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "None",
    // });

    res.cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {}
};

const forgotPassword = async (req, res) => {
  // get email, find user in the db, set reset passwordtoken, reset password token expires, user.save , send email with the link to reset password.
  const { email } = req.body;
  console.log(email);
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please provide email",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // send email with the link to reset password
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDER_EMAIL,
      to: user.email,
      subject: "Reset your password",
      text: `Please click on the below url to reset your password:
        ${process.env.BASE_URL}/api/v1/users/reset/${token}
        `,
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Reset Your Password</h2>
        <p>Please click the button below to reset your password:</p>
        <a href="${process.env.BASE_URL}/api/v1/users/reset/${token}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; 
                  text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Reset Password
        </a>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Reset password link sent to your email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const resetPassword = async (req, res) => {
  // get token from params, get password from body, get user from db, set password, set reset password token to undefined, set reset password token expires to undefined, save user.
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide password",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });


  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export {
  registerUser,
  verifyUser,
  loginUser,
  getProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
};
