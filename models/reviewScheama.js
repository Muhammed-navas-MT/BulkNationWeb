const mongoose = require("mongoose");
const {Schema}= mongoose;


const reviewSchema = new Schema({
    productId:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    reviews:[{
        name:{
            type:String,
            required:true
        },
        discription:{
            type:String,
            required:true
        },
        createdOn:{
            type:Date,
            default:Date.now,
        },
    }]
});

const Review = mongoose.model("Review",reviewSchema);

module.exports = Review;