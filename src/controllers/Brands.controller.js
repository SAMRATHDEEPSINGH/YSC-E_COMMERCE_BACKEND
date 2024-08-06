import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { Brand } from "../models/Brand.modals.js";

const fetchBrands=asyncHandler(async(req,res)=>{
    const brands=await Brand.find({}).exec();
    if(!brands){
        throw new ApiError(404,"Could not found brand")
    }

    return res.status(201).json(
        new ApiResponse(200,brands,"brands fetched successfully")
    )
})

const createBrands=asyncHandler(async(req,res)=>{
    const {value,label}=req.body

    if(!value || !label || typeof value!=='string' ||typeof label!=='string'){
        throw new ApiError(400,"Invalid data format")
    }

    // Check if the Brand is already present or not
    const existedBrand=await Brand.findOne({
        $or:[{value},{_id:req.body._id},{label}]
    })

    if (existedBrand) {
        throw new ApiError(409,"Brand with same id or value exists");
    }

    const brand=await Brand.create({
        value,
        label
    })

    const createdBrand=await Brand.findById(brand._id)
    console.log(createdBrand)

    if (!createdBrand) {
        throw new ApiError(500,"Something went wrong while adding the Brand")
    }

    return res.status(201).json(
        new ApiResponse(200,createdBrand,"Brand created successfully")
    )
})

export{
    fetchBrands,
    createBrands
}