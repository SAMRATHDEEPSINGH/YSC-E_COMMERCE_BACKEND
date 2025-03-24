import {buildSchema} from "./buildSchema.js";


const registrationConfig={
    name:{type:'string',required:true,min:3,max:30,trim:true},
    email:{type:'string',required:true,email:true,trim:true,lowercase:true},
    password:{type:'string',required:true,min:6,max:50}
};

const verificationConfig={
    token:{type:'string',required:true,trim:true}
}

export const registrationSchema=buildSchema(registrationConfig);
export const verifcationSchema=buildSchema(verificationConfig);