const express= require("express");
const router =express.Router();
const userControllor= require("../controllers/user/userController");
const passport = require("passport");
const userAuth = require("../middlewares/auth");
const productController = require("../controllers/user/productController");
const profileController = require("../controllers/user/profileController");
const cartController = require("../controllers/user/cartController");
const shopController = require("../controllers/user/shopController");
const checkoutController = require("../controllers/user/checkoutController");


router.get("/pageNotFound",userControllor.pageNotFound);
router.get("/",userControllor.loadHomePage);
router.get("/signup",userControllor.loadsignup);
router.post("/signup",userControllor.signup);
router.post("/otp",userControllor.verifyOtp);
router.post('/resend-otp', userControllor.resendOtp);



router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:"/signup"}),(req,res)=>{
    res.redirect("/");
});

router.post("/login",userControllor.verifyLogin);
router.get("/logout",userControllor.loguot);


// product management
router.get("/productDetails",productController.productDetails);

// profile management
router.get("/forget-password",profileController.getemail)
router.post("/foget-email-valid",profileController.Forgotemail)
router.post("/verify-passForgot-otp",profileController.verifyotp);
router.get("/reset-password",profileController.getResetPassPage);
router.post("/resend-forgot-otp",profileController.resendForgotOtp);
router.post("/reset-password",profileController.resetPassword);
router.get("/userProfile",userAuth.userAuth,profileController.userProfile);
router.post("/updateProfile",userAuth.userAuth,profileController.updateProfile);
// Address management
router.get("/addAddress",userAuth.userAuth,profileController.addAddress);
router.post("/addaddress",userAuth.userAuth,profileController.postAddAddress);
router.get("/userAdresses",userAuth.userAuth,profileController.getAddressPage);
router.get("/editAddress",userAuth.userAuth,profileController.editAddress);
router.post("/postEditAddress/:id",userAuth.userAuth,profileController.postEditAddress);
router.get("/deleteAddress",userAuth.userAuth,profileController.deleteAddress);


// cart manegement
router.get("/addToCart",userAuth.userAuth,cartController.addToCart);
router.get("/getCart",userAuth.userAuth,cartController.getCart);
router.post("/cart/update-quantity",userAuth.userAuth,cartController.quatityUpdate);
router.post("/cart/deleteProduct",userAuth.userAuth,cartController.removeFromCart);
router.post("/add-to-cart",userAuth.userAuth,cartController.productAddToCart);

// shop management
router.get("/shopPage",shopController.getShopPage);
router.get("/priceLowToHigh",shopController.priceLowToHigh);
router.get("/priceHighToLow",shopController.priceHighToLow);
router.get("/sortProductA-Z",shopController.sortAToZ);
router.get("/sortProductZ-A",shopController.sortZToA);
router.get("/popularityProducts",shopController.popularityProducts);
router.get("/latestProduct",shopController.latestProduct);
router.get("/categotySort",shopController.categotySort);
router.get("/checkout",userAuth.userAuth,checkoutController.getcartPage);

router.post('/checkout', (req, res) => {
    const { address, products, subtotal, total } = req.body;

    console.log('Address:', address);
    console.log('Products:', products);
    console.log('Subtotal:', subtotal);
    console.log('Total:', total);

    // Process the order (e.g., save to database, initiate payment)
    res.status(200).json({ message: 'Order placed successfully!' });
});


router.post('/cart/update-quantity', async (req, res) => {
    const { productId, action } = req.body;
    try {
        // Fetch product and cart details
        const product = await Product.findById(productId);
        const cart = req.session.cart; // Assume cart is stored in session

        // Update quantity logic
        const cartItem = cart.items.find(item => item.productId === productId);
        if (!cartItem) return res.status(404).send({ message: "Product not found in cart" });

        if (action === 'increase' && cartItem.quantity < product.quantity) {
            cartItem.quantity += 1;
            console.log("+ 1");
        } else if (action === 'decrease' && cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            console.log("-1");
        } else {
            return res.status(400).send({ message: "Invalid action or quantity limit reached" });
        }

        // Recalculate cart totals
        cart.total = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        req.session.cart = cart;

        res.send({ message: 'Quantity updated successfully', cart });
    } catch (error) {
        res.status(500).send({ message: 'Failed to update quantity' });
    }
});



module.exports=router;