const Order = require("../../models/orderSchema")

// const renderOrderPage = async (req, res) => {
//     try {
//         const orders = await Orders.find()
//             .populate('userId', 'name') // Populate user details (assuming a `name` field exists)
//             .populate('orderedItems.id', 'name') // Populate product names
//             .select('orderId shippingAddress orderedItems status createdOn totalPrice'); // Select required fields

//         // Format data for EJS
//         const formattedOrders = orders.map(order => ({
//             id: order.orderId,
//             customerName: order.shippingAddress.name,
//             product: order.orderedItems.map(item => item.name),
//             price: order.totalPrice,
//             status: order.status,
//             date: new Date(order.createdOn).toLocaleDateString(), // Format the date
//         }));
//         console.log("gpt data",formattedOrders)
//         // Render the EJS template and pass the formatted orders
//         res.render('order', { orders: formattedOrders });
//     } catch (error) {
//         console.error('Error fetching orders:', error);
//         res.status(500).send('An error occurred while loading the orders page.');
//     }
// };



const renderOrderPage = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name') // Populate user details
            .populate('orderedItems.id', 'name productImage') // Populate product names and images
            .select('orderId shippingAddress orderedItems status createdOn totalPrice'); // Select required fields

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
        console.log("Formatted Orders:", formattedOrders);
        res.render('order', { orders: formattedOrders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('An error occurred while loading the orders page.');
    }
};




const getOrderDetailsView = async (req, res) => {
    try {
        console.log(req.query); // Logs the query params for debugging
        const orderId = req.query.id; // Extract the order ID from query parameters

        // Query the database for the order by `orderId`
        const orderDetails = await Order.findOne({ orderId: orderId })
            .populate('orderedItems.id', ' productImage') // Populate the correct product details
            .lean(); // Convert Mongoose document to plain JS object for easier manipulation

        // Handle case where no order is found
        if (!orderDetails) {
            return res.status(404).render("pageNotFound");
        }

        const address = orderDetails.shippingAddress; // Extract shipping address
        res.render("orderView", {
            order: orderDetails,
            address: address || {}, // Fallback to empty object if address is undefined
            activePage: "orders", // Set the active page for menu highlighting
        });
    } catch (error) {
        console.error("Error retrieving order details:", error); // Log errors for debugging
        res.status(500).redirect("/pageNotFound"); // Redirect to error page on server errors
    }
};


const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.query;
        console.log("id status",orderId,status)
        if (!orderId || !status) {
            return res.status(400).send("Order ID and status are required.");
        }

         const updatedOrder = await Order.findOneAndUpdate({orderId:orderId},{ $set: { status } },{ new: true } );


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
