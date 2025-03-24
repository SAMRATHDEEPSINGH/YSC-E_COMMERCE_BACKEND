import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { Product } from "../models/Product.modals.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import fs from "fs"
import cloudinary from "cloudinary"
import { error } from "console";
import path from "path";

const checkImageExists = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    console.log(result)
    return result; // If resource is found, return the result
  } catch (error) {
    if (error.http_code === 404) {
      return null; // Image not found
    }
    throw error; // Other errors should be thrown
  }
};

const deleteUploadedFiles = (req) => {
    const filesToDelete = Object.values(req.files).flat().map(file => file.path);
    console.log(filesToDelete)
  
    filesToDelete.forEach(filePath => {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted temporary file: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting temporary file: ${filePath}`, error);
      }
    });
  };

const removeImageFromcloudinary=async(imageUrl)=>{
  try {
    const imageDetails=await checkImageExists(imageUrl)
    if (imageDetails) {
      const urlArray=imageUrl.split('/');
      console.log(urlArray);
      const image=urlArray[urlArray.length-1];
      console.log(image);
      const imageName=image.split('.')[0];
      console.log(imageName);
      cloudinary.uploader.destroy(imageName,(error,result)=>{
        console.log(error,result);
      })
    }
    else{
      console.log("Image not found on cloudinary");
      return null;
    }
  } catch (error) {
    throw new ApiError(500,"Something went wrong while deleting the Product image");
  }
}


const createProduct=asyncHandler (async(req,res)=>{
    const {title,description,price,discountPercentage,rating,stock,brand,category,thumbnail,images}=req.body
    

    // Check for Empty Data
    if (
        !title || !description || !category || !price || !discountPercentage || !rating || !stock || !brand ||
        typeof title !== 'string' || typeof description !== 'string' || typeof category !== 'string' ||
        typeof price !== 'number' || typeof discountPercentage !== 'number' || typeof rating !== 'number' ||
        typeof stock !== 'number' || typeof brand !== 'string' ||
        !Array.isArray(images) || images.length === 0 || images.some(img => typeof img !== 'string') ||
        typeof thumbnail !== 'string'
      ) {
        throw new ApiError(400, "Invalid data format");
      }

    // Check if the Product is Already Present in the data
    const existedProduct=await Product.findOne({
        $or:[{title},{_id:req.body._id}]
    })

    if (existedProduct) {
        deleteUploadedFiles(req)
        throw new ApiError(409,"Product with same id or title exists");
    }


    let thumbnailUrl="";
    let imageUrls=[];
    
    if (thumbnail && images.length > 0 && typeof thumbnail === 'string' && typeof images[0] === 'string') {
        thumbnailUrl = thumbnail;
        imageUrls = images;
    }
    
    else{
    const thumbnailPath=req.files?.thumbnail[0]?.path;
    const imageLocalPath=req.files?.images?.map(file=>file.path);

    if(!thumbnailPath || !imageLocalPath.length){
        throw new ApiError(400,"File is Required")
    }
    const thumbnail=await uploadOnCloudinary(thumbnailPath)
    const images=await Promise.all(imageLocalPath.map(path=>uploadOnCloudinary(path)))

    if (!thumbnail || !images.length) {
        throw new ApiError(400,"thumbnail and images are required")
    }
    thumbnailUrl=thumbnail.url;
    imageUrls=images.map(image=>image.url)
}

    // Store all the data to the database
    const product=await Product.create({
        title,
        description,
        price,
        discountPercentage,
        rating,
        stock,
        brand,
        category,
        thumbnail:thumbnailUrl,
        images:imageUrls

    })

    const createdProduct=await Product.findById(product._id)
    console.log(createProduct)

    if (!createdProduct) {
        throw new ApiError(500,"Something went wrong while adding the Product")
    }

    return res.status(201).json(
        new ApiResponse(200,createdProduct,"Product created Successfully")
    )

})


const fetchProducts = asyncHandler(async (req, res) => {
  let query = Product.find({});  // Don't use await here
  let totalProductsQuery = Product.find({});  // Don't use await here

  // Apply filters based on query parameters
  if (req.query.category) {
    query = query.where({ category: req.query.category });
    totalProductsQuery = totalProductsQuery.where({ category: req.query.category });
  }

  if (req.query.brand) {
    query = query.where({ brand: req.query.brand });
    totalProductsQuery = totalProductsQuery.where({ brand: req.query.brand });
  }

  // Apply sorting if sort and order are specified
  if (req.query._sort && req.query._order) {
    const sortField = req.query._sort;
    const sortOrder = req.query._order === 'asc' ? 1 : -1;
    query = query.sort({ [sortField]: sortOrder });
  }

  // Count total documents matching the query
  const totalDocs = await totalProductsQuery.countDocuments().exec();
  console.log({ totalDocs });

  // Apply pagination if _page and _limit are specified
  if (req.query._page && req.query._limit) {
    const pageSize = parseInt(req.query._limit);
    const page = parseInt(req.query._page);
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  // Execute the final query and fetch the documents
  const docs = await query.exec();
  
  if (!docs) {
    throw new ApiError(404, "Could not find products");
  }

  // Set the total count in the response headers
  res.set('X-Total-Count', totalDocs);

  // Send the response with the fetched products
  return res.status(201).json(
    new ApiResponse(200, docs, "Products fetched successfully")
  );
});


const fetchProductById=(async(req,res)=>{
  const {id}=req.params
  if(!id){
    throw new ApiError(400,"Id for product is missing")
  }

  const product=await Product.findById(id);

  if (!product) {
    throw new ApiError(404,"Could not find Product")
  }

  return res.status(201).json(
    new ApiResponse(200,product,"Fetched Product Successfully")
  )
})

const updateProduct=asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const {
      title,
      description,
      price,
      discountPercentage,
      rating,
      stock,
      brand,
      category,
      thumbnail, // URL or File
      images // Array of URLs or Files
    } = req.body;

    const updateFields = {};

    // Validate and assign basic fields
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (price) updateFields.price = price;
    if (discountPercentage) updateFields.discountPercentage = discountPercentage;
    if (rating) updateFields.rating = rating;
    if (stock) updateFields.stock = stock;
    if (brand) updateFields.brand = brand;
    if (category) updateFields.category = category;

    console.log('Initial updateFields:', updateFields);
    
    // Handle thumbnail (URL or File)
    if (thumbnail || req.files?.thumbnail) {
      if (thumbnail && typeof thumbnail === 'string' && thumbnail.startsWith('http')) {
        // If thumbnail is a URL
        updateFields.thumbnail = thumbnail;
      } else if (req.files?.thumbnail) {
        // If thumbnail is uploaded as a file
        const thumbnailPath = req.files.thumbnail[0].path;
        const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);
        if (thumbnailUpload?.url) {
          updateFields.thumbnail = thumbnailUpload.url;

          const oldThumbnail = await Product.findById(id).select('thumbnail');
          if (oldThumbnail?.thumbnail && oldThumbnail.thumbnail.includes('cloudinary')) {
            await removeImageFromcloudinary(oldThumbnail.thumbnail);
          }
        } else {
        throw new ApiError(400,"Error while uploading thumbnail");
        }
      } else {
        throw new ApiError(400,"Invalid thumbnail data");
      }
    }

    console.log('After thumbnail handling, updateFields:', updateFields);

    // Handle images (Array of URLs or Files)
    if (images || req.files?.images) {
      if (Array.isArray(images) && images.every(img => typeof img === 'string' && img.startsWith('http'))) {
        // If images are URLs
        updateFields.images = images;
      } else if (req.files?.images) {
        // If images are uploaded as files
        const imageLocalPaths = req.files.images.map(file => file.path);
        const uploadedImages = await Promise.all(imageLocalPaths.map(async (path) => {
          const uploadResult = await uploadOnCloudinary(path);
          return uploadResult?.url || null;
        }));

        if (uploadedImages.every(url => url)) {
          updateFields.images = uploadedImages;

          const oldImages = await Product.findById(id).select('images');
          if (Array.isArray(oldImages?.images) && oldImages.images.length > 0) {
            await Promise.all(oldImages.images.map(async (imageUrl) => {
              if (imageUrl.includes('cloudinary')) {
                const imageName = imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(imageName);
              }
            }));
          }
        } else {
          throw new ApiError(400,"Error while uploading images" );
        }
      } else {
        throw new ApiError(400,"Invalid image data");
      }
    }

    console.log('After images handling, updateFields:', updateFields);

    if (Object.keys(updateFields).length === 0) {
      throw new ApiError(400,"No update data provided");
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new ApiError(500,"Something went wrong");
    }

    return res.status(201).json(
     new ApiResponse(200,updateProduct,"Product Updated Successfully")
    );
})





export{
    createProduct,
    fetchProducts,
    fetchProductById,
    updateProduct
}