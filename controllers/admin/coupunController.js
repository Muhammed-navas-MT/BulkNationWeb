const Coupon = require("../../models/couponSchema");



const loadCoupon = async(req,res)=>{
    try {

        const findCoupons = await Coupon.find({});
        return res.render("coupon",{coupons:findCoupons})
    } catch (error) {
        return res.redirect("/pageNotFound")
    }
};


const createCoupon = async (req, res) => {
    console.log(req.body);
    try {
        const data = {
            name: req.body.name,
            createdOn: req.body.createdOn + "T00:00:00",
            expireOn: req.body.expireOn + "T00:00:00",
            offerPrice: parseInt(req.body.offerPrice),
            minimumPrice: parseInt(req.body.minimumPrice),
        };

        const existingCoupon = await Coupon.findOne({
            name: { $regex: new RegExp(`^${data.name}$`, "i") }
        });
        
        if (existingCoupon) {
            console.log("Coupon with this name already exists.");
            return res.status(400).json({ success: false, message: "This name already exists." });
        }
        

        const newCoupon = new Coupon({
            name: data.name,
            createdOn: data.createdOn,
            expireOn: data.expireOn,
            offerPrice: data.offerPrice,
            minimumPrice: data.minimumPrice,
        });

        await newCoupon.save();
        console.log("Coupon data:", data);
        return res.status(200).json({success:true,message:"Coupon added successfully!"});
    } catch (error) {
        console.log("Coupon add error:", error.message);
        return res.redirect("/admin/pageNotFound");
    }
};



const editCoupon = async (req, res) => {
    console.log(req.query.id);
    console.log(req.body);
    try {
        const id = req.query.id;
        const { name, createdOn, expireOn, offerPrice, minimumPrice } = req.body;

        const existingCoupon = await Coupon.findOne({ name:{$regex: new RegExp(`^${name}$`,"i")}, _id: { $ne: id } });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: "Coupon name already exists." });
        }

        const data = {
            name,
            createdOn: createdOn + "T00:00:00",
            expireOn: expireOn + "T00:00:00",
            offerPrice: parseInt(offerPrice, 10),
            minimumPrice: parseInt(minimumPrice, 10),
        };

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true } // Return the updated document
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        return res.status(200).json({ success: true, message: "Coupon updated successfully." });
    } catch (error) {
        console.error("Error updating coupon:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
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