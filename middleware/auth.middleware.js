import jwt from "jsonwebtoken";

// middleware to verify user through the jwt token
export const isLoggedIn = async (req, res, next) => {
  // get the token from the req, check with the database, get the data

  try {
    console.log(req.cookies);
    let token = req.cookies?.token;

    if (!token) {
      console.log("no token");
      return res.status(400).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decodedToken", decodedToken);
    req.user = decodedToken;

    // next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
    console.log(error.message);
  }

  next();
};
