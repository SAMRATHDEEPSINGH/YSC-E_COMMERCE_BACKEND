import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";

const userSchema=new Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        match:[/^\S+@\S+\.\S+$/,'Please enter a valid email address'],
    },
    password:{
        type:String,
        required:[true,"Password is Required"]
    },
    role:{
        type:String,
        required:true,
        enum:["user","admin"],
        default:"user"
    },
    addresses:{
        type:[Schema.Types.Mixed],
        default:[]
    },
    name:{
        type:String,
        required:true,
        trim:true,
    },
    isVerified:{
        type:Boolean,
        default:false, //For email verification
    },
    refreshToken:{
        type:String,
    },
    resetToken:{
        type:String,
        default:null,
    },
    resetTokenExpiry:{
        type:Date,
        default:null,
    },
    
},{timestamps:true});

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        const salt=await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
    }
    next();
});

const user=mongoose.model("User",userSchema);
export default user;