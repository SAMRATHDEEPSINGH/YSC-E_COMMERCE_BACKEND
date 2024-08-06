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

const fetchProducts=asyncHandler(async(req,res)=>{
  let query=Product.find({})
  let totalProductsQuery=Product.find({})

  if (req.query.category) {
    query=query.find({category:req.query.category});
    totalProductsQuery=totalProductsQuery.find({category:req.query.category});

  }

  if (req.query.brand) {
    query=query.find({brand:req.query.brand})
    totalProductsQuery=totalProductsQuery.find({brand:req.query.brand})
    
  }

  if (req.query._sort && req.query._order) {
    query=query.sort({[req.query._sort]:req.query._order});
  }

  const totalDocs=await totalProductsQuery.countDocuments().exec();
  console.log({totalDocs})

  if(req.query._page && req.query._limit){
    const pageSize=req.query._limit;
    const page=req.query._page;
    query=query.skip(pageSize*(page-1)).limit(pageSize)
  }


  const docs=await query.exec();
  if(!docs){
    throw new ApiError(404,"Could not found product")
  }

  res.set('X-Total-Count',totalDocs);

  
  return res.status(201).json(
    new ApiResponse(200,docs,"Product fetched categorically")
)
  

})

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

const updateProduct=(async(req,res)=>{
  const {id}=req.params
  const {title,description,price,discountPercentage,rating,stock,brand,category,thumbnail,images}=req.body
  if (
    (title && typeof title !== 'string') ||
    (description && typeof description !== 'string') ||
    (category && typeof category !== 'string') ||
    (price && typeof price !== 'number') ||
    (discountPercentage && typeof discountPercentage !== 'number') ||
    (rating && typeof rating !== 'number') ||
    (stock && typeof stock !== 'number') ||
    (brand && typeof brand !== 'string') ||
    (thumbnail && typeof thumbnail !== 'string') ||
    (images && (!Array.isArray(images) || images.some(img => typeof img !== 'string')))
  ) {
    throw new ApiError(400, "Invalid data format");
  }
  const updateFields={}
  if (title) updateFields.title = title;
if (description) updateFields.description = description;
if (price) updateFields.price = price;
if (discountPercentage) updateFields.discountPercentage = discountPercentage;
if (rating) updateFields.rating = rating;
if (stock) updateFields.stock = stock;
if (brand) updateFields.brand = brand;
if (category) updateFields.category = category;
// if (thumbnail) updateFields.thumbnail = thumbnail;
// if (images) updateFields.images = images;
  // const thumbnailUrlPath=req.file?.thumbnail[0]?.path
  // const imageUrlPath=req.file?.images?.map(file=>file.path)
  if (!updateFields) {
    throw new ApiError(400,"No update data provided")
  }

  let thumbnailUrl=""
  let imageUrls=[]
  if (thumbnail) {
    if (typeof thumbnail === 'string' && !thumbnail.startsWith('http')) {
      // If thumbnail is a URL
      thumbnailUrl = thumbnail;
    } else if (req.files?.thumbnail) {
      // If thumbnail is uploaded as a file
      const thumbnailPath = req.files.thumbnail[0]?.path;
      if (thumbnailPath) {
        try {
          const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);
          if (thumbnailUpload && thumbnailUpload.url) {
            thumbnailUrl = thumbnailUpload.url;
            // Remove old thumbnail if exists
            const oldThumbnail = await Product.findById(id).select('thumbnail');
            if (oldThumbnail?.thumbnail) {
              await removeImageFromCloudinary(oldThumbnail.thumbnail);
            }
          } else {
            return res.status(400).json({ error: "Error while uploading thumbnail" });
          }
        } catch (error) {
          return res.status(500).json({ error: "Failed to upload thumbnail" });
        }
      } else {
        return res.status(400).json({ error: "Thumbnail file is missing" });
      }
    } else {
      return res.status(400).json({ error: "Invalid thumbnail data" });
    }
    updateFields.thumbnail = thumbnailUrl;
  }

  // Handle images URLs or file uploads
  if (images) {
    if (Array.isArray(images)) {
      if (images.every(img => typeof img === 'string' && !img.startsWith('http'))) {
        // If images are URLs
        imageUrls = images;
      } else if (req.files?.images) {
        // If images are uploaded as files
        const imageLocalPaths = req.files.images.map(file => file.path);
        if (imageLocalPaths.length > 0) {
          try {
            const uploadedImages = await Promise.all(imageLocalPaths.map(async (path) => {
              const uploadResult = await uploadOnCloudinary(path);
              return uploadResult && uploadResult.url ? uploadResult.url : null;
            }));
            if (uploadedImages.every(url => url)) {
              imageUrls = uploadedImages;
              // Remove old images if exists
              const oldImages = await Product.findById(id).select('images');
              if (Array.isArray(oldImages?.images) && oldImages.images.length > 0) {
                await Promise.all(oldImages.images.map(async (imageUrl) => {
                  const urlArray = imageUrl.split('/');
                  const imageName = urlArray[urlArray.length - 1].split('.')[0];
                  await new Promise((resolve, reject) => {
                    cloudinary.uploader.destroy(imageName, (error, result) => {
                      if (error) {
                        console.error('Error removing image from Cloudinary:', error);
                        return reject(error);
                      }
                      resolve(result);
                    });
                  });
                }));
              }
            } else {
              return res.status(400).json({ error: "Error while uploading images" });
            }
          } catch (error) {
            return res.status(500).json({ error: "Failed to upload images" });
          }
        } else {
          return res.status(400).json({ error: "No images to upload" });
        }
      } else {
        return res.status(400).json({ error: "Invalid image data" });
      }
      updateFields.images = imageUrls;
    }
  }
//   if (thumbnail || images) {
//   if (thumbnail && typeof thumbnail==='string') {
//     thumbnailUrl=thumbnail;
//   }
//   if (images>0 && typeof images[0]==='string') {
//     imageUrls=images;
//   }
//   if(req.files?.thumbnail){
//     const thumbnailPath=req.files?.thumbnail[0]?.path;
//     if (!thumbnailPath) {
//       throw new ApiError(200,"Thumbnail is missing")
//     }
//     const thumbnailnew=await uploadOnCloudinary(thumbnailPath)
//     if (!thumbnailnew.url) {
//       throw new ApiError(400,"Error while uploading thumbnail")
//     }
//     thumbnailUrl=thumbnailnew.url
//   }
//   if(thumbnailUrl){
//   const oldThumbnail=await Product.findById(id).select('thumbnail')
//   if (oldThumbnail.thumbnail) {
//     await removeImageFromcloudinary(oldThumbnail.thumbnail)
//   }
//   updateFields.thumbnail = thumbnailUrl;
//   }

//   if (req.files.images.every(file=>file.path)) {
//     const imageLocalPath=req.files?.images?.map(file=>file.path);
//     if (!imageLocalPath.length) {
//       throw new ApiError(400,"Images is missing")
//     }
//     const images=await Promise.all(imageLocalPath.map(path=>uploadOnCloudinary(path)))
//     if (!images.every(image=>image.url)) {
//       throw new ApiError(400,"Error while uploading images")
//     }
//     imageUrls=images.map(image=>image.url)
//   }
//   if (Array.isArray(imageUrls) && imageUrls.length>0) {
//     const oldImages=await Product.findById(id).select('images')
//     if(Array.isArray(oldImages.images) && oldImages.images.length>0){
//       await Promise.all(oldImages.images.map(imageurl=>removeImageFromcloudinary(imageurl)))
//     }
//     updateFields.images = imageUrls;
//   }

// }

const updatedProduct=await Product.findByIdAndUpdate(
  id,
  {$set:updateFields},
  {new:true,runValidators:true}
)
console.log(updatedProduct)

if (!updatedProduct) {
  throw new ApiError(500,"Something went wrong")
}

return res.status(201).json(
  new ApiResponse(200,updatedProduct,"Product Updated Successfully")
)

})




export{
    createProduct,
    fetchProducts,
    fetchProductById,
    updateProduct
}