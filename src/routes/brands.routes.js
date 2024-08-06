import { Router } from "express";
import { createBrands, fetchBrands } from "../controllers/Brands.controller.js"


const router = Router()

router.route("/").get(fetchBrands)
router.route("/").post(createBrands)


export default router