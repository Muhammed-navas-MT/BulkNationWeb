const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require('../../models/orderSchema');
const { model } = require("mongoose");
const { json } = require("express");





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
        const orderUpdate = await Order.updateOne(
            { userId: userId, orderId: orderId }, 
            { $set: { status: "Cancelled" } } 
        );

       if (orderUpdate.modifiedCount === 0) {
           return res.status(400).json({success:false,message:"Order not found"})
        };

        return res.status(200).json({success:true,message:"Your Order Cancelled"})
    } catch (error) {
        console.log("order cancelled error",error.message);
        res.status(500).json({success:false,message:"Internal Server Error"});
    }
}




module.exports = {
    getOrderPage,
    singleOrder,
    cancelOrder,
}