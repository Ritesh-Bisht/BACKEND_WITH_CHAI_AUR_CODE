import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async(userId)=>{
try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}

} catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
}
}
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImageLocalPath.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )


const loginUser = asyncHandler(async (req, res)=>{
    // req body -> data
    // username or email 
    // find the user 
    //password check
    // access and request token 
    // send cookie

    const {email, username, password } = req.body
    if(!username || !email)
        {
            throw new ApiError(400, "username or email is required"); 
        }

       const user = await User.findOne({
        // advance syntax : mongoDB operator
            $or:[{username},{email}]
        })
        if(!user)
            {
                throw new ApiError(404, "user does not exist"); 
            }
     const isPasswordValid = await user.isPasswordCorrect(password)
     if(!isPasswordValid)
        {
            throw new ApiError(401, "INVALID USER CREDENTIALS"); 
        }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    // generated Access And Refresh Tokens

   const loggedInUser = await User.findById(user._id).
   select("-password -refreshToken") // eliminate fields 

    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status[200]
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User Logged IN Successfully"
        )
    )
})

 const logoutUser =  asyncHandler(async(req, res )=>{
    // user can only logout their own account not anyone else
    // hence use middleware that also uses in images
    await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
            refreshToken:undefined,
        },
    },
        {

        }

)
       const options={
        httpOnly:true,
        secure:true
       }

       return res
       .status()
       .clearCookie("accessToken")
       .clearCookie("refreshToken")
       .json(new ApiResponse(200, {}, "success ! User Logged Out") )


 })
export {
    loginUser,
    registerUser,
    logoutUser,
}