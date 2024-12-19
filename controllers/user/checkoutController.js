const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require('../../models/orderSchema');
const Coupon = require("../../models/couponSchema");
const Razorpay = require('razorpay');
const crypto = require('crypto');



const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getcheckoutPage = async (req, res) => {
    console.log("Fetching cart details...");
    try {
        const user = req.session.user;
        const productId = req.query.id || null;
        const quantity = parseInt(req.query.quantity) || 1; 

        if (!user) {
            return res.redirect("/signup");
        }

        const coupon = await Coupon.find({});
        const address = await Address.findOne({userId:user._id}) || [];
        if (!productId) {
            const cart = await Cart.findOne({ userId: user._id }).populate("items.productId");

            if (!cart || !cart.items || cart.items.length === 0) {
                return res.redirect("/");
            }

            // const products = cart.items.map(item => {
            //     const product = item.productId; 
            //     const productImage = product?.productImage || []; 
            //     return {
            //         _id: product._id,
            //         productName: product.productName,
            //         productImage: productImage.length > 0 ? productImage : ["default-image.jpg"], 
            //         salePrice: product.salePrice || 0, 
            //         quantity: item.quantity || 1 
            //     };
            // });

            const products = cart.items
            .filter((item) => item.productId && item.productId.isBlocked === false) // Filter items where isBlocked is false
            .map((item) => {
              const product = item.productId;
              const productImage = product?.productImage || [];
              return {
                _id: product._id,
                productName: product.productName,
                productImage: productImage.length > 0 ? productImage : ["default-image.jpg"],
                salePrice: product.salePrice || 0,
                quantity: item.quantity || 1,
              };
            });
          
            const subtotal = products.reduce((sum, item) => {
                return sum + item.salePrice * item.quantity;
            }, 0);
            const adr = address.address || [];
            return res.render("checkout", { user, product: products, subtotal ,quantity:null,address:adr,coupons:coupon});
        }

        if (productId) {
            // const product = await Product.findById(productId);
            const product = await Product.findOne({_id:productId,isBlocked:false})
            if (!product) {
                // return res.redirect("/pageNotFound");
                return res.render("checkout", { user, product: [], subtotal:0,quantity:0 ,address:address.address,coupons:coupon});
            }


            const productData = {
                _id: product._id,
                productName: product.productName,
                productImage: product.productImage?.length > 0 ? product.productImage : ["default-image.jpg"],
                salePrice: product.salePrice || 0,
                quantity: quantity 
            };

            const subtotal = productData.salePrice * quantity;
         

            return res.render("checkout", { user, product: [productData], subtotal,quantity:quantity ,address:address.address,coupons:coupon});
        }
    } catch (error) {
        console.error("Error fetching checkout page:", error.message);
        return res.redirect("/pageNotFound");
    }
};



const createRazorpayOrder = async (amount) => {
    try {
        const options = {
            amount: amount * 100, 
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`,
            payment_capture: 1
        };
        
        const razorpayOrder = await razorpay.orders.create(options);
        return razorpayOrder;
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        throw error;
    }
};

const postCheckout = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.redirect("/login");
        }

        const { address, products, subtotal, total, paymentMethod, couponCode, discount } = req.body;

        console.log(discount);
        if (paymentMethod === "Cash On Delivery") {
           
            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ success: false, message: "No products provided" });
            }
    
            const groupedProducts = products.reduce((acc, item) => {
                acc[item.id] = acc[item.id] || { ...item, quantity: 0 };
                acc[item.id].quantity += item.quantity;
                return acc;
            }, {});
    
            for (let productId in groupedProducts) {
                const item = groupedProducts[productId];
                const product = await Product.findById(productId); 
    
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
                }
    
                if (product.quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Not enough stock for product: ${product.name}`,
                    });
                }
    
                product.quantity -= item.quantity;
                await product.save();
            }

            const findUser = await User.findByIdAndUpdate(
                { _id: userId._id },
                {$push: {coupons: { code: couponCode, appliedAt: new Date() }}},
                { new: true }
            );
    
            const newOrder = new Order({
                userId: userId,
                orderedItems:products,
                shippingAddress: address,
                totalPrice: subtotal,
                finalAmount: total,
                status: "pending",
                paymentMethod: paymentMethod,
                payment_status:"Pending",
                discount:discount,

            });
            
            await Cart.findOneAndUpdate({userId:userId._id}, {$set:{items:[]}});
    
            const orderSave = await newOrder.save();
            if (orderSave) {
                const orderId = newOrder._id
                return res.status(200).json({ success: true, message: "Order placed", orderId:orderId});
            } else {
                return res.status(400).json({ success: false, message: "Error saving order" });
            }
        }

        if (paymentMethod === "Online") {
            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ success: false, message: "No products provided" });
            };


            const groupedProducts = products.reduce((acc, item) => {
                acc[item.id] = acc[item.id] || { ...item, quantity: 0 };
                acc[item.id].quantity += item.quantity;
                return acc;
            }, {});
    
            for (let productId in groupedProducts) {
                const item = groupedProducts[productId];
                const product = await Product.findById(productId); 
    
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
                }
    
                if (product.quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Not enough stock for product: ${product.name}`,
                    });
                }
    
                product.quantity -= item.quantity;
                await product.save();
            }
            
            const newOrder = new Order({
                userId: userId,
                orderedItems: products,
                shippingAddress: address,
                totalPrice: subtotal,
                finalAmount: total,
                status: "pending",
                paymentMethod: paymentMethod,
                payment_status:"pending",
                discount:discount,
            });

            const findUser = await User.findByIdAndUpdate(
                { _id: userId._id },
                {$push: {coupons: { code: couponCode, appliedAt: new Date() }}},
                { new: true }
            );

            
            const savedOrder = await newOrder.save();
            await Cart.findOneAndUpdate({userId:userId._id}, {$set:{items:[]}});
           
            const options = {
                amount: total * 100,
                currency: "INR",
                receipt: savedOrder._id.toString(), 
                payment_capture: 1
            };

            const razorpayOrder = await razorpay.orders.create(options);

           
            savedOrder.razorpayOrderId = razorpayOrder.id;
            await savedOrder.save();

           
            return res.status(200).json({ 
                success: true, 
                razorpay: {
                    key: process.env.RAZORPAY_KEY_ID,
                    order: razorpayOrder,
                    amount: total
                },
                orderDetails: savedOrder
            });
        }

        return res.status(400).json({ success: false, message: "Invalid payment method" });
    } catch (error) {
        console.log("Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

       
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.payment_status="Success"
        order.paymentDetails = {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        };
        await order.save();

        // Reduce product quantities
        for (let item of order.orderedItems) {
            const product = await Product.findById(item.id);
            product.quantity -= item.quantity;
            await product.save();
        }

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { userId: order.userId },
            { $set: { items: [] } }
        );

        return res.status(200).json({ 
            success: true, 
            message: "Payment successful", 
            orderId: order._id 
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const orderComform = async(req,res)=>{
    const orderId = req.query.id;
    try {
        if(!req.session.user){
            return res.redirect("/signup");
        }
       const order = await Order.findById({_id:orderId})
      return  res.render("orderComform",{totalPrice:order.finalAmount,date:order.createdOn.toLocaleDateString()});
        
    } catch (error) {
        console.log("error in onform page ",error.message);
        return res.redirect("/pageNotFound")
    }
};





module.exports = {
    getcheckoutPage,
    postCheckout,
    orderComform,
    verifyRazorpayPayment,
};

