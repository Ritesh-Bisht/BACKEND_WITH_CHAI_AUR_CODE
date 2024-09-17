import multer from "multer";

// storage middleware creation
const storage = multer.diskStorage({
    destination: function (req, file, cb) { 
      // req contains json data , but not file 
      // that is why file ( as parameter) from multer is used
      // cb is callback
      cb(null, "./public/temp") // where to save files
    },
    
    
    filename: function (req, file, cb) {
      console.log(file) 
      cb(null, file.originalname)
      // can also add suffix instead of original name
    }
  })
  
export const upload = multer({ 
    storage // export storage middleware
})