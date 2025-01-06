const Order = require("../../models/orderSchema")


// const renderOrderPage = async (req, res) => {
//     try {
//         const orders = await Order.find()
//             .populate('userId', 'name') 
//             .populate('orderedItems.id', 'name productImage') 
//             .select('orderId shippingAddress orderedItems status createdOn totalPrice'); 

//         // Format data for EJS
//         const formattedOrders = orders.map(order => ({
//             id: order.orderId,
//             customerName: order.shippingAddress.name,
//             address: `${order.shippingAddress.addressType}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`,
//             phone: order.shippingAddress.phone,
//             products: order.orderedItems.map(item => ({
//                 name: item.name,
//                 productImage: item.id.productImage,
//                 price: item.price,
//                 quantity: item.quantity,
//             })),
//             price: order.totalPrice,
//             status: order.status,
//             date: new Date(order.createdOn).toLocaleDateString(),
//         }));
//         console.log("Formatted Orders:", formattedOrders);
//         res.render('order', { orders: formattedOrders });
//     } catch (error) {
//         console.error('Error fetching orders:', error);
//         res.status(500).send('An error occurred while loading the orders page.');
//     }
// };



const renderOrderPage = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page, 10);
        }

        const limit = 10;

        // Fetch orders with pagination and search
        const orders = await Order.find({
            $or: [
                { orderId: { $regex: ".*" + search + ".*", $options: "i" } },
                { "shippingAddress.name": { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        })
            .populate('userId', 'name')
            .populate('orderedItems.id', 'name productImage')
            .select('orderId shippingAddress orderedItems status createdOn totalPrice')
            .sort({ createdOn: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await Order.countDocuments({
            $or: [
                { orderId: { $regex: ".*" + search + ".*", $options: "i" } },
                { "shippingAddress.name": { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        });

        const totalPage = Math.ceil(count / limit);

        // Format data for EJS
        const formattedOrders = orders.map(order => ({
            id: order.orderId,
            customerName: order.shippingAddress.name,
            address: `${order.shippingAddress.addressType}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`,
            phone: order.shippingAddress.phone,
            products: order.orderedItems.map(item => ({
                name: item.name,
                productImage: item.id.productImage,
                price: item.price,
                quantity: item.quantity,
            })),
            price: order.totalPrice,
            status: order.status,
            date: new Date(order.createdOn).toLocaleDateString(),
        }));

        res.render('order', { 
            orders: formattedOrders, 
            totalPage: totalPage, 
            currentPage: page 
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('An error occurred while loading the orders page.');
    }
};




const getOrderDetailsView = async (req, res) => {
    try {
        console.log(req.query);
        const orderId = req.query.id; 

       
        const orderDetails = await Order.findOne({ orderId: orderId })
            .populate('orderedItems.id', 'productName productImage') 
            .lean(); 

        
        if (!orderDetails) {
            return res.status(404).render("pageNotFound");
        }

        const address = orderDetails.shippingAddress;
        res.render("orderView", {
            order: orderDetails,
            address: address || {}, 
            activePage: "orders", 
        });
    } catch (error) {
        console.error("Error retrieving order details:", error); 
        res.status(500).redirect("/pageNotFound"); 
    }
};


const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.query;
        console.log("id status",orderId,status);
        if (!orderId || !status) {
            return res.status(400).send("Order ID and status are required.");
        }
        if(status==="Delivered"){
            const updatedOrder = await Order.findOneAndUpdate({orderId:orderId},{ $set: { status ,payment_status:"Success"} },{ new: true } );
            if (updatedOrder) {
                return res.redirect("/admin/order");
            } else {
                return res.status(404).send("Order not found.");
            }
        }
         const updatedOrder = await Order.findOneAndUpdate({orderId:orderId},{ $set: { status ,} },{ new: true } );

        if (updatedOrder) {
            return res.redirect("/admin/order");
        } else {
            return res.status(404).send("Order not found.");
        }
    } catch (error) {
        console.error("Error in updating status:", error);
        return res.status(500).send("Internal server error.");
    }
};



module.exports = {
    renderOrderPage,
    getOrderDetailsView,
    updateStatus,
};
