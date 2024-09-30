import { asyncHandler } from "../utils/asyncHandler.js";
// using asyncHandler as we are using try catch or promises many times 
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        // Access Refresh Token in Database
        user.refreshToken = refreshToken

        // save without validation of password 
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken} // return both as object


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

// Most Improtant syntax 
const registerUser = asyncHandler( async (req, res) => {
    // 1. get user details from frontend
    // 2. validation - not empty
    // 3. check if user already exists: username, email
    // 4. check for images, check for avatar
    // 5. upload them to cloudinary, avatar and get img path from cloudinary
    // 6. create user object - create entry in database 
    // 7. remove password and refresh token field from response
    // 8. check for user creation
    // 9. return response or error

    // 1. getting user details
    const {fullName, email, username, password } = req.body
    console.log(" req.body : ",req.body)
    console.log(" email: ", email);
    console.log(" username: ",username);
    // 2. validation - non empty
    if (
        // Advanced Syntax instead of if else multiple times
            [fullName, email, username, password].some((field) => field?.trim() === "")
        //
    ) {
        throw new ApiError(400, "All fields are required")
    }
    
    // 
    // import User from mongoose
    // then it will find 
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
        // return if any one match
    })
    
    // 3. CHECK if user already exists
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);

    // 4. CHECK for images and avatar 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
       // same as below // classic else if coz above is giving error
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // 5. UPLOAD on cloudinary
    // import uploadOnCloudinary from file
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   
    // 7. CREATE user's database entry

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // this can be empty
        email, 
        password,
        username: username.toLowerCase()
    })

    // _id is added to every entry in database 
    const createdUser = await User.findById(user._id)
    .select( // inside this we write what to exclude like -password -refreshToken etc
        "-password -refreshToken"
    )

    // now check for server error
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // otherwise everything is fine
    // import ApiResponse and use proper Api response
    // 8. RETURN RESPONSE
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res)=>{
    // 1. get data from the req body 
    // 2. username or email 
    // 3. find the user 
    // 4. if user exists password check
    // 5. if password is correct generate access and request token 
    // 6. send tokens in secure cookie

    // step 1. get data from the req body
    const {email, username, password } = req.body
    console.log(email);

    // step 2.
    if(!username && !email) // both username and email required
        {
            throw new ApiError(400, "username or email is required"); 
        }

    // step 3. 
       const user = await User.findOne({
        // advance syntax : mongoDB operator
            $or:[{username},{email}] 
            // if one of them either username or email is present the find 
        })

    // step 4. if user exists or not 
        if(!user)
            {
                throw new ApiError(404, "user does not exist"); 
            }

    // step 5. if password is correct generate access and request token 
     const isPasswordValid = await user.isPasswordCorrect(password)
     if(!isPasswordValid)
        {
            throw new ApiError(401, " Sorry INVALID USER CREDENTIALS"); 
        }
    
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
    // generated Access And Refresh Tokens

    //  step 6. send tokens in secure cookie
   const loggedInUser = await User.findById(user._id).
   select("-password -refreshToken") 
   // eliminate unnecessary fields 

    const options = {
        httpOnly:true, // 
        secure:true // by default only from server can be modified not from frontend
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse( 
            // ApiResponse
            200, // this.statusCode
            {    // this.data
                user : loggedInUser, accessToken, refreshToken
                // apart from cookies sendind both token 
                /* Maybe the user wants to save it in local storage 
                 or he is developing a mobile application, that is why we are sending separate cookies.
                */
            },
            "User Logged IN Successfully" // this.message

        )
    )
})

 const logoutUser =  asyncHandler(async(req, res )=>{
    // user can only logout their own account not anyone else
    // hence use middleware same as we were using in images
    await User.findByIdAndUpdate(
    req.user._id, // here user is coming from middleware verifyJWT 
    {
        // mongoDB operator like $set $unset
        $unset:{
            refreshToken:1
        }
    },
        {
            new:true
        }

)
       const options={
        httpOnly:true,
        secure:true
       }

       return res
       .status(200)
       .clearCookie("accessToken", options)
       .clearCookie("refreshToken", options)
       .json(new ApiResponse(200, {}, "okay !!!! User Logged Out") )


 })

const refreshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        // if refresh token not found
        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request refresh token not found ")
        }


        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )
        
            const user = await User.findById(decodedToken?._id)
        
            // refresh token is available but suspicious or Invalid 
            if (!user) {
                throw new ApiError(401, "Invalid refresh token")
            }
         // chech for refresh token from req is same as user 
            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used")
                
            }
        
            // now generate access and refresh token 
            const options = {
                httpOnly: true,
                secure: true
            }
        
            const {newAccessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        
            return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {newAccessToken, refreshToken: newRefreshToken},
                    "Access token refreshed successfully "
                )
            )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }
    
}
)

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    // if old password is incorrect
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    // if old password is correct
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, " congrats Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json
    ( new ApiResponse(
        200,
        req.user,
        " current User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    // get details from that are going to be updated
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    // takes 3 things id, {}, {}
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName, // same as fullName: fullName
                email: email // same as email
            }
        },
        {new: true}
        
    ).select("-password") // remove password field

    return res
    .status(200)
    .json(new ApiResponse(200, user, " your Account details updated successfully"))
});

// updation of files require multer 
const updateUserAvatar = asyncHandler(async(req, res) => {
    // get the file from req.files with the help of multer middleware 
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
        
    }
    // same as updateAccountDetails in above fn 
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading coverImage on cloudinary")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})
const getUserChannelProfile = asyncHandler(async(req, res) =>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        //
        {
            $match:{
                username : username?.toLowerCase()
            }
        },
        { 
            //pipeline for subscribers
            $lookup:{
                from:"subscriptions", // model name (lowecase +plural )
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        //pipeline for Subscribed
        {
            $lookup:{
                from:"subscriptions", // model name (lowecase +plural )
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        // pipeline for add both the above fields
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscibedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $condition:{ // 3 parameters
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                }
            }
         }
        },
        { /* only project selected things
            set flag 1 for select 
            */
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscibedToCount:1,
                isSubscribed:1,
                avatart:1,
                coverImage:1,
                email:1,

            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404, "channel Does not exist");
        
    }
    console.log(channel)
    return res
    .status(200)
    .json(
        new ApiError(
            200,
            channel[0],
            "User channel[0] fetched succesfully" 
        )
    )
    
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}