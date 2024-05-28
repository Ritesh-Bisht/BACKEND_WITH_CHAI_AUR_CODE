import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

export default router;