import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import {errorHandler} from "./middlewares/errorHandler.js"
import {assignRequestId} from "./middlewares/requestId.middleware.js"


const app=express()


app.use(cookieParser());


app.use(cors({
    origin:true,
    credentials:true,
    exposedHeaders:['X-Total-Count']
}))

app.use(express.json())
// app.use(express.urlencoded({extended:true,limit:"16kb"}))
// app.use(express.static("public"))

import productRoutes from './routes/product.routes.js';
import brandroutes from './routes/brands.routes.js';
import categoryroutes from './routes/category.routes.js';
import authroutes from './routes/Auth.routes.js';
// import cartroutes from './routes/Cart.routes.js'
app.use(assignRequestId);

app.use("/auth",authroutes)
app.use("/products",productRoutes)
app.use("/brands",brandroutes)
app.use("/category",categoryroutes)
// app.use("/cart",cartroutes)

app.use(errorHandler);

export {app}