const Coupon = require("../../models/couponSchema");



const loadCoupon = async(req,res)=>{
    try {

        const findCoupons = await Coupon.find({});
        return res.render("coupon",{coupons:findCoupons})
    } catch (error) {
        return res.redirect("/pageNotFound")
    }
};


const createCoupon = async(req,res)=>{
    try {
        const data = {
            name:req.body.name,
            createdOn:req.body.createdOn+ "T00:00:00",
            expireOn:req.body.expireOn + "T00:00:00",
            offerPrice:parseInt( req.body.offerPrice),
            minimumPrice:parseInt( req.body.minimumPrice)
        }

        const newCoupun = new Coupon({
            name:data.name,
            createdOn:data.createdOn,
            expireOn:data.expireOn,
            offerPrice:data.offerPrice,
            minimumPrice:data.minimumPrice
        })

        await newCoupun.save();
        console.log("coupon data",data);
        return res.redirect("/admin/coupon")
    } catch (error) {
        console.log("coupon add error ",error.message);
        res.redirect("/admin/pageNotFoud")
    }
};


const editCoupon = async(req,res)=>{
    try {
        const id = req.query.id;
        const data = {
            name: req.body.name,
            createdOn: req.body.createdOn + "T00:00:00",
            expireOn: req.body.expireOn + "T00:00:00",
            offerPrice: parseInt(req.body.offerPrice, 10),
            minimumPrice: parseInt(req.body.minimumPrice, 10)
        };
        const findCoupon = await Coupon.findByIdAndUpdate(
            id,
            { $set: data }, 
            { new: true } 
        );
        if(!findCoupon){
          return res.send("coupon not find")
        };

        return res.redirect("/admin/coupon");

    } catch (error) {
        
    }
};

const deleteCoupon =async(req,res)=>{
    try {
        const id = req.params.productId;
        console.log("i wil come here with id pass",id);
        const findAndDelete = await Coupon.findByIdAndDelete(id);
       if(!findAndDelete){
        return res.status(404).json({success:false,message:"Coupon not found"})
       };
       return res.status(200).json({success:true,message:"coupon delete successfully"})
    } catch (error) {
        console.log("coupon delete error",error.message);
        res.status(500).json({success:false,message:"Internal Server Error"})
    }
}


module.exports ={
    loadCoupon,
    createCoupon,
    editCoupon,
    deleteCoupon,
}