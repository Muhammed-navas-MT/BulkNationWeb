const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const { compareSync } = require("bcrypt");


const getcartPage = async (req, res) => {
    console.log("Fetching cart details...");
    try {
        const user = req.session.user;
        const productId = req.query.id || null;
        const quantity = parseInt(req.query.quantity) || 1; // Ensure quantity is a number
        console.log("Quantity:", quantity);

        // Redirect to login if no user session exists
        if (!user) {
            return res.redirect("/login");
        }

        const address = await Address.findOne({userId:user._id});
        console.log(address.address);

        if (!productId) {
            // Fetch cart details with populated product information
            const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");

            // If the cart is empty or does not exist
            if (!cart || !cart.items || cart.items.length === 0) {
                return res.render("checkout", { user, product: [], subtotal: 0 ,quantity:null,address:address.address});
            }

            // Map the cart items to include necessary product details
            const products = cart.items.map(item => {
                const product = item.productId; // Populated product details
                const productImage = product?.productImage || []; // Default to an empty array if no images exist
                return {
                    _id: product._id,
                    productName: product.productName,
                    productImage: productImage.length > 0 ? productImage : ["default-image.jpg"], // Fallback image
                    salePrice: product.salePrice || 0, // Default to 0 if missing
                    quantity: item.quantity || 1 // Default quantity to 1
                };
            });

            // Calculate subtotal
            const subtotal = products.reduce((sum, item) => {
                return sum + item.salePrice * item.quantity;
            }, 0);

            console.log("Cart details with subtotal:", products, subtotal);

            // Render the checkout page with populated data
            return res.render("checkout", { user, product: products, subtotal ,quantity:null,address:address.address});
        }

        if (productId) {
            // Fetch specific product details when a product ID is provided
            const product = await Product.findById(productId);
            if (!product) {
                return res.redirect("/pageNotFound");
            }

            console.log("Single product details:", product);

            const productData = {
                _id: product._id,
                productName: product.productName,
                productImage: product.productImage?.length > 0 ? product.productImage : ["default-image.jpg"],
                salePrice: product.salePrice || 0,
                quantity: quantity // Use the quantity from the query
            };

            const subtotal = productData.salePrice * quantity;

            // Render the checkout page with the specific product details
            return res.render("checkout", { user, product: [productData], subtotal,quantity:quantity ,address:address.address});
        }
    } catch (error) {
        console.error("Error fetching checkout page:", error.message);
        return res.redirect("/pageNotFound");
    }
};



module.exports = {
    getcartPage,
};

