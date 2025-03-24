import { ApiError } from "../utils/ApiError.js";

export const validate=(schema,source="body")=>(req,res,next)=>{
    try {
        const data=source==="query" ? req.query: req.body;
        const {error,value}=schema.validate(data);
        
        if(error){
            console.log("Error in validate middleware",error);
            throw new ApiError(400,error.details[0].message);
        }
    req.body=value;
    next();
        
    } catch (err) {
        next(err);
    }
};