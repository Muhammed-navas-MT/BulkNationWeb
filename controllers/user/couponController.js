const Coupon = require("../../models/couponSchema");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");



const applyCoupon = async(req,res)=>{
    console.log("Iam coming here");
    try {
        const couponCode = req.body.coupon;
        const totalPrice= parseInt(req.body.totalPrice);
        const user = req.session.user;
        console.log(typeof(totalPrice));
        console.log("productId",totalPrice,"couponcode",couponCode);
        if(!user){
            return res.redirect("/signup");
        };
            if(!couponCode || !totalPrice){
                return res.status(404).json({success:false,message:"Not find the data"})
            };
    
            const findCouponCode = await Coupon.findOne({name:couponCode});
    
            if(!findCouponCode){
                return res.status(404).json({success:false,message:"Invalid Coupon Code"})
            };
            const today = new Date();
            if(findCouponCode.expireOn<today){
                return res.status(404).json({success:false,message:`Coupon Expired at ${findCouponCode.expireOn.toLocaleDateString()}`})
            };

            console.log("chacking the coupon code");
            const finduser = await User.findOne({ _id: user._id });
            const findCoupon = finduser.coupons.find((item) => item.code === couponCode);

            console.log("checked the coupon code");
            if(findCoupon){
                return res.status(400).json({success:false,message:"Your already usred this coupon"});
            }
    
            if(findCouponCode.minimumPrice>=totalPrice){
                return res.status(404).json({success:false,message:`Please purchase graterthan ${findCouponCode.minimumPrice}`});
            };
            
           
                const discountAmount = (totalPrice * findCouponCode.offerPrice) / 100;
                const discountedPrice = totalPrice - discountAmount;
                
                console.log("Discount Amount:", discountAmount);
                console.log("Discounted Price:", discountedPrice);
                return res.status(200).json({success:true,message:"Coupon apply successfully",totalPrice:discountedPrice,code:couponCode,discountAmount:discountAmount})
            
       
    } catch (error) {
        console.log("coupon apply error",error.message);
        return res.status(500).json({success:false,message:"Internal Server Error"});
    }
};

const removeCoupon = async(req,res)=>{
    try {
        const couponCode = req.body.coupon;
        const totalPrice= parseInt(req.body.totalPrice);
        const user = req.session.user;
        console.log(typeof(totalPrice));
        console.log("totalPrice",totalPrice,"couponcode",couponCode);
        if(!user){
            return res.redirect("/signup");
        };
            if(!couponCode || !totalPrice){
                return res.status(404).json({success:false,message:"Not find the data"})
            };

            const findCouponCode = await Coupon.findOne({name:couponCode});


            return res.status(200).json({success:true,message:"Coupon remove successfully",totalPrice:totalPrice})


    } catch (error) {
        console.log("remove coupon error",error.message);
        return res.status(500).json({success:false,message:"Internal Server Error"});
    }
}




module.exports = {
    applyCoupon,
    removeCoupon,
}