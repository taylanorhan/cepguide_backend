const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Ensure your User model has an index on 'email' for performance improvement:
// User.createIndexes({ email: 1 });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists with this email.");
    }
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).send("User registered");
  } catch (error) {
    if (error.message.includes("timed out")) {
      res
        .status(508)
        .send("Request timeout: Database operation took too long.");
    } else {
      res.status(500).send(error.message);
    }
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send("Invalid credentials");
    }
    const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only use secure cookie in production
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    if (error.message.includes("timed out")) {
      res
        .status(508)
        .send("Request timeout: Database operation took too long.");
    } else {
      res.status(500).send(error.message);
    }
  }
};
