const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");


const productDetails = async(req,res)=>{
    try {
        // const userId = req.session.user._id;
        // console.log(userId)
        // const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category;
        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;
        const products = await Product.find({ category: findCategory });
        const error = req.query.error || "";
        console.log(findCategory)
        res.render("productDetails",{
            // user:userData,
            user:null,
            product:product,
            quantity:Product.quantity,
            totalOffer:totalOffer,
            category:findCategory,
            flavor:product.flavor,
            similar:products,
            error :error,
        })
    } catch (error) {
        console.log("details page error",error.message)
        res.redirect("/pageNotFound");
    }
}

module.exports ={
    productDetails,
}