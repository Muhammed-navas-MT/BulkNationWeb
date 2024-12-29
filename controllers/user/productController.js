const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Review = require("../../models/reviewScheama");



const productDetails = async(req,res)=>{
    try {
    const user = req.session.user || null
        // const userId = req.session.user._id;
        // console.log(userId)
        // const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category;
        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        let totalOffer = 0
        const products = await Product.find({ category: findCategory });
        const error = req.query.error || "";
        console.log(findCategory);

        if (categoryOffer > productOffer) {
         totalOffer = categoryOffer;
        } else if (productOffer > categoryOffer) {
         totalOffer = productOffer;
        } else {
          totalOffer = productOffer;
        };

        let latestReviews =null;
        let allReviewsAscending =null;
        let review = await Review.findOne({productId:productId}) || null;
        if (review) {
             latestReviews = review.reviews
                .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
                .slice(0, 4); 
             allReviewsAscending = review.reviews.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        }
        console.log("all",allReviewsAscending);
        console.log("latedtss",latestReviews);

        res.render("productDetails",{
            // user:userData,
            user:user,
            product:product,
            quantity:Product.quantity,
            totalOffer:totalOffer,
            category:findCategory,
            flavor:product.flavor,
            similar:products,
            error :error,
            review:review,
            latestReviews:latestReviews,
            allReviewsAscending:allReviewsAscending
        })
    } catch (error) {
        console.log("details page error",error.message)
        res.redirect("/pageNotFound");
    }
};


module.exports ={
    productDetails,
}