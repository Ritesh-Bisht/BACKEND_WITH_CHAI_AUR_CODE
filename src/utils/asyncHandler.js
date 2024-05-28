const asyncHandler = (reqHandler)=>{
    return (req, res, next)=>{
        Promise
        .resolve(
            reqHandler(req, res, next)
        )
        .catch((e)=>next(e))
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