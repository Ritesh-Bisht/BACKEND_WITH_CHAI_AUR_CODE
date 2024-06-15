
import jwt from "jsonwebtoken"
import { User } from "../models/user.model"
export const verifyJWT = asyncHandler(async(req, _ , next)=>{
  // "_" is used in Production for unused Variables
  try {
     const token =  req.cookies?.accessToken || req.header("Autorization")?.replace("Bearer","")
      if(!token){
          throw new ApiError(401, "Unauthorized request ")
      }
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
      const user = await User.findById(decodedToken?._id)
      .select("-password -refreshToken")
  
      if(!user)
          {
              throw new ApiError(401, "Invalid Access Token")
          }
  
      req.user=user;
      next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
  }
})