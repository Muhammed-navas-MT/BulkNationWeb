const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require('../../models/orderSchema');
const Wallet = require("../../models/walletSchema");
const Reason = require("../../models/reasonSchema");
const razorpay = require('razorpay');
const crypto = require('crypto');
const env =require("dotenv").config();
const { model } = require("mongoose");
const { json } = require("express");
const { userProfile } = require("./profileController");
const { status } = require("init");



const getOrderPage = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/signup");
        }

        const userId = req.session.user._id;
        const orders = await Order.find({ userId: userId });


        if (!orders || orders.length === 0) {
            return res.render("orderDetails", { orders: [] });
        }


        const orderedItems = orders.map(order => {
            return order.orderedItems || [];
        });
        
        orders.sort((a,b)=>b.createdOn- a.createdOn);

        return res.render("orderDetails", { orders });
    } catch (error) {
        console.error("Error rendering order page:", error.message);
        res.redirect("/pageNotFound");
    }
};



const singleOrder = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/signup");
        }

        const userId = req.session.user._id;
        const orderId = req.query.id;
        const order = await Order.findOne({ userId, orderId }).lean();

        if (!order) {
            return res.render("singleOrder", {
                shippingAddress:{},
                orderId: "",
                orderDate: "",
                orderedItems: [],
                paymentMethod: "",
                paymentStatus: ""
            });
        };

        const orderedItems = order.orderedItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * parseFloat(item.price)
        }));
        const { shippingAddress, paymentMethod, payment_status: paymentStatus } = order;

        res.render("singleOrder", {
            shippingAddress:shippingAddress,
            order:order,
            orderId: order.orderId,
            orderDate: order.createdOn.toDateString(),
            orderedItems,
            paymentMethod,
            paymentStatus
        });
    } catch (error) {
        console.error("Error rendering single order:", error.message);
        res.redirect("/pageNotFound");
    }
};


const cancelOrder =async(req,res)=>{
    try {
        const userId = req.session.user._id;
        const orderId = req.params.id;

        if(!userId){
            return res.redirect("/signup");
        }
    //     const orderUpdate = await Order.updateOne(
    //         { userId: userId, orderId: orderId }, 
    //         { $set: { status: "Cancelled" ,payment_status:"Refund"} } 
    //     );

    //    if (orderUpdate.modifiedCount === 0) {
    //        return res.status(400).json({success:false,message:"Order not found"})
    //     };


        const findOrder = await Order.findOne({
            userId: userId,
            orderId: orderId,
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

          const orderDetails = await Order.findOne({orderId:orderId});
          console.log(orderDetails,"this is a order details");

          if(orderDetails.paymentMethod =="Online" && orderDetails.payment_status == "Success"){

            let wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                const newWallet = new Wallet({
                    userId: userId,
                    balance: orderDetails.finalAmount,
                    transactions: [{
                        type: "Refund",
                        amount: orderDetails.finalAmount,
                        orderId: orderId
                    }]
                });
    
                console.log("Creating a new wallet...");
                await newWallet.save();
            } else {
                const finalAmount = parseFloat(orderDetails.finalAmount)
                wallet.balance += finalAmount;
                wallet.transactions.push({
                    type: "Refund",
                    amount: orderDetails.finalAmount,
                    orderId: orderId
                });
                await wallet.save();
            }

            const orderUpdate = await Order.updateOne(
                { userId: userId, orderId: orderId }, 
                { $set: { status: "Cancelled" ,payment_status:"Refund"} }
            );
    
           if (orderUpdate.modifiedCount === 0) {
               return res.status(400).json({success:false,message:"Order not found"})
            };
          } 

          if(orderDetails.paymentMethod == "Cash On Delivery"){
            const orderUpdate = await Order.updateOne(
                { userId: userId, orderId: orderId }, 
                { $set: { status: "Cancelled" ,payment_status:"Cancelled"} }
            );
    
           if (orderUpdate.modifiedCount === 0) {
               return res.status(400).json({success:false,message:"Order not found"})
            };
          }

    

          
        return res.status(200).json({success:true,message:"Your Order Cancelled"})
    } catch (error) {
        console.log("order cancelled error",error.message);
        res.status(500).json({success:false,message:"Internal Server Error"});
    }
};


const returnOrder = async(req,res)=>{
    try {
        const user = req.session.user;
        if(!user){
            return res.redirect("/signup")
        };
        const orderId = req.body.orderId;
        const reason = req.body.reason;
        const finalAmount = parseFloat(req.body.finalAmount);

        if(!orderId && !reason){
            return res.status(404).json({success:false,message:"does not have reason"})
        };

        const orderUpdate = await Order.updateOne(
            { userId: user._id, orderId: orderId }, 
            { $set: { status: "Return Request"} } 
        );
        if(!orderUpdate){
            return res.status(404).json({success:false,message:"Order Not Found"})
        }

        const saveReason = new Reason({
            userId:user._id,
            orderId:orderId,
            reason:reason,
            refundAmount:finalAmount,
        });
        await saveReason.save();

        return res.status(200).json({success:true,message:"Return Request successfully"})
    } catch (error) {
        console.log("order return error",error.message);
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
};


const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});



const repaymetOrder = async (req, res) => {
    try {
        const { orderId, finalAmount } = req.body;
        console.log("Received Body:", req.body);

        if (!orderId || !finalAmount) {
            return res.status(400).json({ success: false, message: 'Order ID and Amount are required.' });
        }

        const amountInPaise = Math.round(parseFloat(finalAmount) * 100);

        if (isNaN(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount.' });
        }

        // Generate a short hash of the orderId to use as the receipt
        const shortOrderId = crypto.createHash('md5').update(orderId).digest('hex').substr(0, 10);
        const receipt = `re_${shortOrderId}`;

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: receipt,
            payment_capture: 1
        };

        console.log("Razorpay Order Options:", options);

        const razorpayOrder = await razorpayInstance.orders.create(options);

        console.log("Payment Order Created:", razorpayOrder);

        res.status(200).json({
            success: true,
            razorpay: {
                key: process.env.RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                order: razorpayOrder,
            },
            orderId: orderId,
        });
    } catch (error) {
        console.error('Razorpay Error:', error);
        
        // More detailed error logging
        if (error.error && error.error.description) {
            console.error('Razorpay Error Description:', error.error.description);
        }

        res.status(500).json({ 
            success: false, 
            message: 'Failed to initiate re-payment.',
            error: error.error ? error.error.description : 'Unknown error'
        });
    }
};

const verifyRePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        console.log("Received payment verification details:", { razorpay_order_id, razorpay_payment_id, razorpay_signature,orderId });

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature ||!orderId) {
            return res.status(400).json({ success: false, message: 'All payment details are required.' });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.log('Signature mismatch. Expected:', expectedSignature, 'Received:', razorpay_signature);
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        // Find the order using razorpayOrderId
        const order = await Order.findOne({orderId:orderId});

        if (!order) {
            console.log(`Order not found for Razorpay order ID: ${razorpay_order_id}`);
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        console.log('Order found:', order);

        // Update the order
        order.payment_status = "Success";
        order.paymentDetails = {
            razorpayOrderId:razorpay_order_id , // Keep the existing razorpayOrderId
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        };

        await order.save();

        console.log("Updated order:", order);

        res.status(200).json({
            success: true,
            message: 'Re-payment successful!',
            orderId: order.orderId,
        });
    } catch (error) {
        console.error('Error verifying re-payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify re-payment.',
            error: error.message
        });
    }
};

module.exports = {
    getOrderPage,
    singleOrder,
    cancelOrder,
    returnOrder,
    repaymetOrder,
    verifyRePayment,
}