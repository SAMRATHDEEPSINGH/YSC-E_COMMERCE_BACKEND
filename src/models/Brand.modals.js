import mongoose,{Schema} from "mongoose"

const brandSchema=new Schema({
    value:{
        type:String,
        required:true,
        unique:true
    },
    label:{
        type:String,
        required:true,
        unique:true
    }

},{timestamps:true})

export const Brand=mongoose.model("Brand",brandSchema)