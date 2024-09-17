import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // file system of node : help to read, write , remove, permission etc

// configuration for cloudinary account
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// we can directly work without function but we are using method for organised manner
const uploadOnCloudinary = async (localFilePath) => {
    // using try catch to handle the problem
    
    //
    try {
        // 1. if filepath doesn`t exist can also return error message could not find the path 
        if (!localFilePath) return null

        // 2. upload the file on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath, 
            {
            resource_type: "auto"
            }
        )
        // after file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        console.log(response)

       // unlink file synchronously  sfter successfully unpload
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}
    