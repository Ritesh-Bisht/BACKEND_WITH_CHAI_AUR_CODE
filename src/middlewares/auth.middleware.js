import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

   // "_" instead of res production grade code 
export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ", "")
        // removed from Authorization
        
         console.log(` after verifyJWT this is token `,token);

         // if token is not found
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
         
        /* if token is found then then decode using jwt.verify 
           and then using decodedToken find user 
        */ 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // because we have written ._id in the user.model.js
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
      console.error("Error:", error); // Log the error
        throw new ApiError(401, error?.message || "Invalid access token") 
        // optionally check for error message
    }
    
})