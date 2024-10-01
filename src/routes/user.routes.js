import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    //1. Middleware before Execution
       
    
    // single for 1 field , array for multiple files in 1 field
    upload.fields([
        {
            name: "avatar", // frontend field
            maxCount: 1
        },
        {
            name: "coverImage", // front end field
            maxCount: 1
        }
    ]),
    
    //2. Execution 
    registerUser
    )

router.route("/login").post(loginUser)

    // SECURED ROUTES
    router.route("/logout").post(verifyJWT, logoutUser)
    //here using middleware verifyJWT

    router.route("/refresh-token").post(refreshAccessToken);
    router.route("/change-password").post(verifyJWT, changeCurrentPassword)
    router.route("/current-user").post(verifyJWT, getCurrentUser)
    router.route("/update-account").patch(verifyJWT, updateAccountDetails)
    router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
    router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
    router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
    router
    .route("/history")
    .get(
        verifyJWT, 
        getWatchHistory
    )



export default router;