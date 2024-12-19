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
const orderController = require("../controllers/user/orderController");
const wishlistController = require("../controllers/user/wishlistController");
const couponController = require("../controllers/user/couponController");
const walletController = require("../controllers/user/walletController")


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
// router.get("/priceLowToHigh",shopController.priceLowToHigh);
// router.get("/priceHighToLow",shopController.priceHighToLow);
// router.get("/sortProductA-Z",shopController.sortAToZ);
// router.get("/sortProductZ-A",shopController.sortZToA);
// router.get("/popularityProducts",shopController.popularityProducts);
// router.get("/latestProduct",shopController.latestProduct);
// router.get("/categotySort",shopController.categotySort);
router.get("/checkout",userAuth.userAuth,checkoutController.getcheckoutPage);
router.post("/checkout",userAuth.userAuth,checkoutController.postCheckout);
router.get("/orderComform",checkoutController.orderComform);
// router.get('/products/search',shopController.searchProducts);

// Order management
router.get("/orderDetails",userAuth.userAuth,orderController.getOrderPage);
router.get("/singeOrder",userAuth.userAuth,orderController.singleOrder);
router.post("/cancelOrder/:id",userAuth.userAuth,orderController.cancelOrder);
router.post("/returnOrder",userAuth.userAuth,orderController.returnOrder);

// wishlist management
router.get("/wishlist",userAuth.userAuth,wishlistController.getWishlist);
router.post("/add-to-wishlist",userAuth.userAuth,wishlistController.addproductToWishlist);
router.post("/delete-to-wishlist",userAuth.userAuth,wishlistController.deteteToWishlist);
router.post('/verify-payment', checkoutController.verifyRazorpayPayment);


// coupon management
router.post("/apply-coupon",userAuth.userAuth,couponController.applyCoupon);
router.post("/remove-coupon",userAuth.userAuth,couponController.removeCoupon);

// wallet management
router.get("/wallet",userAuth.userAuth,walletController.getWallet);



module.exports=router;