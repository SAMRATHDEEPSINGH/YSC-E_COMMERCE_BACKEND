import express from "express"
import cors from "cors"

const app=express()


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json())
// app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

import productRoutes from './routes/product.routes.js'
import brandroutes from './routes/brands.routes.js'
import categoryroutes from './routes/category.routes.js'

app.use("/products",productRoutes)
app.use("/brands",brandroutes)
app.use("/category",categoryroutes)

export {app}