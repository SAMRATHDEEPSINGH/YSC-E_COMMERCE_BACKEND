import { Router } from "express";
import { createProduct, fetchProducts, fetchProductById,updateProduct } from "../controllers/Product.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/createProduct").post(upload.fields(
    [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 3 }
    ]
), createProduct)

router.route("/").get(fetchProducts)
router.route("/:id").get(fetchProductById)
router.route("/:id").patch(upload.fields([
    {
        name: 'thumbnail',
        maxCount: 1
    },
    {
        name:'images',
        maxCount:3
    }
]),updateProduct)

export default router