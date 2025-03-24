import { ApiError } from "./ApiError.js";

export const validationHelper=(condition,statusCode,message)=>{
    // console.log("inside validationHelper");
    
    if(!condition){
        console.log("inside if");
        throw new ApiError(statusCode,message)
    }
}