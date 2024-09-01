import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) { 
      // req contains json data , but not file 
      // that is why file ( as parameter) from multer is used
      // cb is callback
      cb(null, "./public/temp") // where to save files
    },
    
    
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})