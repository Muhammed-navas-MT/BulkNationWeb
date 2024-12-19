const Wishlist = require("../../models/wishlistSchema");
const Product = require("../../models/productSchema");


const addproductToWishlist = async (req, res) => {
    console.log("working add to wishlist");
    try {
        const userId = req.session.user._id || null ;
        const id = req.body.productId;

        if (userId === null) {
            return res.redirect("/signup");
        }

        const products = await Product.findById({ _id: id });
        if (!products) {
            return res.status(400).json({ success: false, message: "Product Not Found" });
        }

        const wishlist = await Wishlist.findOne({ userId: userId });
        if (!wishlist) {
            const newProduct = new Wishlist({
                userId: userId,
                products: [{
                    productId: id
                }]
            });

            console.log("new wishlist", newProduct);

            await newProduct.save();
            return res.status(200).json({ success: true, message: "This Product added to Wishlist" });
        }


        const existingProduct = wishlist.products.find(product => product.productId.toString() === id);
        if (existingProduct) {
            return res.status(400).json({ success: false, message: "Product already exists in Wishlist" });
        }

        wishlist.products.push({ productId: id });
        await wishlist.save();

        return res.status(200).json({ success: true, message: "Product added to Wishlist" });
    } catch (error) {
        console.log("add product to wishlist error:", error.message);
        res.redirect("/pageNotFound");
    }
};


const getWishlist = async(req,res)=>{
    try {
        const user = req.session.user;
        if(!user){
            return res.redirect("/signup");
        }
        const wishlistProducts = await Wishlist.find({userId:user._id});
        if(!wishlistProducts || wishlistProducts.length === 0){
            return res.render("wishlist",{user:user,products:[]})
        }
        const product = await Wishlist.findOne({ userId: user._id })
  .populate("products.productId");
let filteredProducts =[];
if (product && product.products) {
   filteredProducts = product.products.filter(
    (item) => item.productId && item.productId.isBlocked === false
  );
}

        return res.render("wishlist",{user:user,products:filteredProducts});
    } catch (error) {
        console.log("get wishlist error",error.message);
        res.redirect("/pageNotFount");
    }
};

const deteteToWishlist = async(req,res)=>{
    try {
        const user = req.session.user;
        const id = req.body.productId;
        if(!user){
            return res.redirect("/signup")
        }
        const findProduct = await Wishlist.findOneAndUpdate(
            { userId: user._id }, 
            { $pull: { products: { productId: id } } }, 
            { new: true } 
          );
          
        if(!findProduct){
            return res.status(404).json({success:false,message:"Product Not Found"});
        };
        return res.status(200).json({success:true,message:"Delete successfully"});
    } catch (error) {
        
    }
}


module.exports = {
    addproductToWishlist,
    getWishlist,
    deteteToWishlist,
}