const mongoose=require("mongoose");
const {Schema} = mongoose;


const addressSchema =new Schema({
    userId:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
    },
    address:[{
        addressType:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        city:{
            type:String,
            requied:true
        },
        landMark:{
            type:String,
            requied:true
        },
        state:{
            type:String,
            requied:true
        },
        pincode:{
            type:Number,
            required:true
        },
        phone:{
            type:String,
            required:true
        },
        altPhone:{
            type:String,
            required:true
        }
    }]
});

const Address= mongoose.model("Address",addressSchema);

module.exports = Address;