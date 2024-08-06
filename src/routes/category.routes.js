import { Router } from "express";
import { fetchCategories,createCategories } from "../controllers/Category.controller.js"


const router = Router()

router.route("/").get(fetchCategories)
router.route("/").post(createCategories)


export default router