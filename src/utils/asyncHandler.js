const asyncHandler = (reqHandler)=>{
    (req, res, next)=>{
        Promise.resolve(reqHandler).catch(()=>next(err))
        .catch((err)=>next(err))
    }
}

export {asyncHandler}

/*
const asyncHandler = (fn)=> async (req, res, next)=>{
    try {
        
    } catch (error) {
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
    }
}
*/