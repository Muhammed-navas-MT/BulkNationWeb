const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProductSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
         required: true
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    productOffer: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        default: true
    },
    size:{
        type:String,
        // required:true
    },
    flavor: {
        type: String,
        required: true
    },
    productImage: {
        type: [String],
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Available", "Out of stock"],
        required: true,
        default: "Available"
    },
    oldPrice:{
        type:Number,
        default:0
    }
}, { timestamps: true });

// Correct usage here
const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
