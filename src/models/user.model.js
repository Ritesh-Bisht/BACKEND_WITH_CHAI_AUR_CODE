import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true // for searching purpose index : true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [ // watchHistory depeends on Video Schema
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required'] // value with custom error message
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true // for accesing ctreatedAt and updatedAt
    }
)
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    // if modified then only change not everytime 
    this.password = await bcrypt.hash(this.password, 10) 
    // 10 rounds
    next()
})

// user defined functions : password encryption
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password) // return true or false
    // password (clear text)  , this.password (from req.body)
    // .methods also has access to the object like .pre
}

// JWT is bearer token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign( // takes parametres
        // 1. payload
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        //2 access tpken
        process.env.ACCESS_TOKEN_SECRET,
        //3 EXPIRY
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
// same as access token but with less information
userSchema.methods.generateRefreshToken = function(){
    // same as access token with less parameters
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // 10 days
        }
    )
}

export const User = mongoose.model("User", userSchema)