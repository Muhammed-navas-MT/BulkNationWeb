const User = require("../../models/userSchema");
const Reason = require("../../models/reasonSchema");
const Order = require("../../models/orderSchema");
const Wallet = require("../../models/walletSchema");
const Product = require("../../models/productSchema");
const { status } = require("init");


const getOrderReason = async(req,res)=>{
    try {

        const admin = req.session.admin;
        if(!admin){
            return res.redirect("/admin/login");
        }
        const findReason = await Reason.find({})
        .populate("userId")
        .sort({ _id: -1 });
        
        if(!findReason){
            return res.render("orderReason",{reasons:[]});
        }
        return res.render("orderReason",{reasons:findReason});
    } catch (error) {
        console.log("order reason controller error",error.message);
        res.redirect("/admin/pageNotFound");
    }
};

const returnReject = async(req,res)=>{
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
        };

        const id = req.body.id;
        if(!id){
            return res.status(404).json({success:false,message:"please try again"});
        }

        const findReason = await Reason.findOneAndUpdate({_id:id},{$set:{returnStatus:"rejected"}});
        if(!findReason){
            return res.status(404).json({success:false,message:"Not find the reason"});
        };
        const findOrderAndUpdate = await Order.findOneAndUpdate({orderId:findReason.orderId},{$set:{status:"Return Reject"}});
        console.log(findOrderAndUpdate,"this is a find order in reject request");

        if(!findOrderAndUpdate){
            return status(404).json({success:false,message:"Not find the Order"})
        };
        res.status(200).json({success:true,message:"Return Request rejected"});
    } catch (error) {
        console.log("return rejected error",error.message);
        res.status(500).json({success:false,message:"Internal Server Error"})
    }
};


const returnAproved = async(req,res)=>{
    console.log("working return aproved controller");
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
        };

        const id = req.body.id;
        console.log("this is id",id);
        if(!id){
            return res.status(404).json({success:false,message:"You dont have ID"});
        };
        const findReason = await Reason.findOne({_id:id});
        const findReasonAndUpdate = await Reason.findByIdAndUpdate({_id:id},{$set:{returnStatus:"approved"}});
        if(!findReasonAndUpdate){
            return res.status(404).json({success:false,message:"Not found  the Reason"})
        };

        const findWallet = await Wallet.findOne({userId:findReason.userId});
        console.log("fi;ndwallet this",findWallet)
        if (!findWallet) {
                        const newWallet = new Wallet({
                            userId: findReason.userId,
                            balance: findReason.refundAmount,
                            transactions: [{
                                type: "Refund",
                                amount: findReason.refundAmount,
                                orderId: findReason.orderId
                            }]
                        });
            
                        console.log("Creating a new wallet...");
                        await newWallet.save();
                        
                        console.log("New Wallet Created:", newWallet);
                    } else {
                        const finalAmount = parseFloat(findReason.refundAmount)
                        findWallet.balance += finalAmount;
                        findWallet.transactions.push({
                            type: "Refund",
                            amount: findReason.refundAmount,
                            orderId: findReason.orderId
                        });
                        console.log("Updating existing wallet...");
                        await findWallet.save();
                        console.log("Updated Wallet:", findWallet);
                    };
                    const findOrder = await Order.findOne({
                        userId: findReason.userId,
                        orderId: findReason.orderId,
                      }).populate('orderedItems.id'); 
                      
                      if (findOrder) {
                        for (const item of findOrder.orderedItems){
                          if (item.id) {
                            const updatedProduct = await Product.findByIdAndUpdate(
                              item.id._id,
                              { $inc: { quantity: item.quantity } },
                              { new: true } 
                            );
                          }
                        }
                      } ;

                      const findOrderAndUpdate = await Order.findOneAndUpdate({orderId:findReason.orderId},{$set:{status:"Returned"}});
                      const findOrderAndUpdated = await Order.findOneAndUpdate({orderId:findReason.orderId},{$set:{payment_status:"Refund"}});
                      console.log(findOrderAndUpdate,"this is a find order in reject request");

                        if(!findOrderAndUpdate){
                          return status(404).json({success:false,message:"Not find the Order"})
                        };
                    res.status(200).json({success:true,message:"Return Return Request Aproved"})    
    }catch (error) {
        console.log("aproved return request error ",error.message);
    }
}



module.exports = {
    getOrderReason,
    returnReject,
    returnAproved,
}