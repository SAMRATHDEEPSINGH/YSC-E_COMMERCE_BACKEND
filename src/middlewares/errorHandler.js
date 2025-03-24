import { ApiError } from "../utils/ApiError.js";

export const errorHandler=(err,req,res,next)=>{
    // console.log("inside errorHandler");
    console.log("requestId error",req.requestId);
    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
            success:false,
            message:err.message,
            data:null,
            requestId:req.requestId,
            errors:err.errors
        });
    }

    res.status(500).json({ error: "Internal Server Error" });
}