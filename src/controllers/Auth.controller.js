import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import User from "../models/user.modals.js";
import { ApiError } from "../utils/ApiError.js";
import {validationHelper} from "../utils/validationHelper.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_SECRET = process.env.EMAIL_SECRET;

const transporter = nodemailer.createTransport({
    service: "gmail",
    secure:true,
    port:465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const signup = async (req,res,next) => {
    const { name, email, password } = req.body;
    // console.log("name,email,password while Signup in Contoller Signup",name,email,password);
    try {
        const existingUser = await User.findOne({ email });
        validationHelper(!existingUser,400,"Email already exists");

        const newUser = await User.create({ name, email, password });
        validationHelper(newUser,400,"User not created");

        const emailToken = jwt.sign({ id: newUser._id }, EMAIL_SECRET, {
            expiresIn: "1h",
        })
        console.log(emailToken)
        validationHelper(emailToken,400,"Email token not created");

        const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${emailToken}`;
        validationHelper(verificationLink,400,"Verification link not created");

        const emailResponse=await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email",
            // html: `<p style="color: blue;">Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
            html:
            `<div style="background-color: #fff; border-radius: 8px; padding: 20px; width: 100%; max-width: 500px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #333;">Verify Your Account</h2>
            <p style="font-size: 16px; color: #666; text-align: center;">Thank you for signing up with YSC (Your Shop Cart)! Please click the link below to verify your email address and complete your registration.</p>
        
            <div style="text-align: center; margin-top: 20px;">
              <a href="${verificationLink}" style="background-color: #28a745; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Verify Email</a>
            </div>
        
            <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">If you didn't sign up for an account, please ignore this email.</p>
          </div>`
        });
        validationHelper(emailResponse,400,"Email not sent");
        return ApiResponse.success(res,201,"Signup Successfully. Please Verify your email",[],req.requestId);
    }catch(error){
        next(error);
    }
};

export const verifyEmail = async (req, res,next) => {
    const { token } = req.query;
    console.log("Token from Request",token);
    try {
      const decoded = jwt.verify(token, EMAIL_SECRET);
      validationHelper(decoded,400,"Not able to Decode Token");

      const user = await User.findById(decoded.id);
      validationHelper(user,400,"User not Found");
  

      validationHelper(!user.isVerified,201,"Email already Verified");
      // if (user.isVerified) return res.status(400).json({ message: "Email already verified" });
  
      user.isVerified = true;
      await user.save();

      const accessToken=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1h"});
      const refreshToken=jwt.sign({id:user._id},process.env.JWT_REFRESH_SECRET,{expiresIn:"7d"});

      user.refreshToken=refreshToken;
      const savedRefToken=await user.save();
      validationHelper(savedRefToken,501,"Error in Storing Refresh Token");


      res.cookie("access_token",accessToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="development",
        sameSite:"Strict",
        maxAge:60*60*1000,
      });


      res.cookie("refresh",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="development",
        sameSite:"Strict",
        maxAge:7*24*60*60*1000,
      });

      res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  
      return ApiResponse.success(res,201,"User Verified Successfully",[],req.requestId);
    } catch (error) {
      next(error)
    }
  };


  export const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      if (!user.isVerified) {
        return res.status(403).json({ message: "Email not verified" });
      }
  
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: "1h",
      });
  
      res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      res.status(500).json({ message: "Error during login", error });
    }
  };

  
  export const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save();
  
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset your password",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      });
  
      res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error) {
      res.status(500).json({ message: "Error during password reset", error });
    }
  };
  

  export const resetPassword = async (req, res) => {
    const { token } = req.query;
    const { newPassword } = req.body;
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
  
      const user = await User.findById(decoded.id);
      if (!user || user.resetToken !== token || user.resetTokenExpiry < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
  
      user.password = newPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
  
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid or expired token", error });
    }
  };
  