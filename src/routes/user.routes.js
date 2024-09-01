import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
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
    //here using verifyJWT middleware 

    router.route("/refresh-token").post(refreshAccessToken);


export default router;