import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { Category } from "../models/Category.modals.js";


const fetchCategories=asyncHandler(async(req,res)=>{
    const categories=await Category.find({}).exec();
    if(!categories){
        throw new ApiError(404,"Could not found brand")
    }

    return res.status(201).json(
        new ApiResponse(200,categories,"brands fetched successfully")
    )
})

const createCategories=asyncHandler(async(req,res)=>{
    const {value,label}=req.body

    if(!value || !label || typeof value!=='string' ||typeof label!=='string'){
        throw new ApiError(400,"Invalid data format")
    }

    // Check if the Category is already present or not
    const existedCategory=await Category.findOne({
        $or:[{value},{_id:req.body._id},{label}]
    })

    if (existedCategory) {
        throw new ApiError(409,"Category with same id or value exists");
    }

    const category=await Category.create({
        value,
        label
    })

    const createdCategory=await Category.findById(category._id)
    console.log(createdCategory)

    if (!createdCategory) {
        throw new ApiError(500,"Something went wrong while adding the Category")
    }

    return res.status(201).json(
        new ApiResponse(200,createdCategory,"Category created successfully")
    )
})


export{
    fetchCategories,
    createCategories
}