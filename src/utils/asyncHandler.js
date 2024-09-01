const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
        .resolve(requestHandler(req, res, next))
        
        .catch((err) => next(err))
    }
}
export { asyncHandler }

/* 
we are using promises instead of try catch 

const asyncHandler = (fn)=> async (req, res, next)=>{
    try {
        
    } catch (error) {
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
    }
}

const asyncHandler = ()=>{}
const asyncHandler = (fn)=>{ ()=>{} }
const asyncHandler = (fn)=> ()=>{} 
const asyncHandler = (fn)=> async ()=>{} 



*/