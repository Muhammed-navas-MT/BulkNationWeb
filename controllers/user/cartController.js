const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");






const getCart = async (req, res) => {
    try {
        const user = req.session.user;

        // Find the user's cart and populate the product details
        const findUserCart = await Cart.findOne({ userId: user._id }).populate(
            "items.productId" // This assumes productId is a reference to the Product model
        );

        if (!findUserCart || findUserCart.items.length === 0) {
            return res.render("cart", { products: [],user:user,cartPrice:0, message: "Your cart is empty." });
        }
        const totalCartPrice = findUserCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        // Extract the populated product details
        const products = findUserCart.items.map(item => ({
            product: item.productId, // The populated product details
            quantity: item.quantity,
            totalPrice: item.totalPrice,
        }));

        // Render the cart view and pass the products to the frontend
        res.render("cart", { products: products,user:user,cartPrice:totalCartPrice});
    } catch (error) {
        console.error("Error fetching cart:", error.message);
        res.redirect("/pageNotFound");
    }
};






const addToCart = async (req, res) => {
    try {
        console.log("I came to the cart page");

        const quantity = parseInt(req.query.quantity) || 1;
        const productId = req.query.id;
        const user = req.session.user;

        if (!user) {
            return res.redirect("/login"); // Redirect if user is not logged in
        }

        // Check if the user already has a cart
        let findCart = await Cart.findOne({ userId: user._id });

        if (!findCart) {
            // Create a new cart if none exists
            const productDetails = await Product.findById(productId); // Fetch product details (assumes Product model exists)
            if (!productDetails) {
                throw new Error("Product not found.");
            }

            const cartProduct = new Cart({
                userId: user._id,
                items: [
                    {
                        productId: productId,
                        totalPrice: productDetails.salePrice * quantity,
                        quantity: quantity,
                    },
                ],
            });

            await cartProduct.save();
            console.log("Cart created and product added.");
        } else {
            // Check if the product already exists in the cart
            const existingProduct = findCart.items.find(
                (item) => item.productId.toString() === productId
            );

            if (existingProduct) {
                // Calculate the per-unit price
                const unitPrice = existingProduct.totalPrice / existingProduct.quantity;
            
                // Update quantity
                existingProduct.quantity += quantity;
            
                // Update totalPrice for the added quantity
                existingProduct.totalPrice += unitPrice * quantity;
            } else {
                // Add the product to the cart
                const productDetails = await Product.findById(productId);
                if (!productDetails) {
                    throw new Error("Product not found.");
                }
            
                findCart.items.push({
                    productId: productId,
                    totalPrice: productDetails.salePrice * quantity,
                    quantity: quantity,
                });
            }
            
            await findCart.save();
            console.log("Product added to existing cart.");
        }

        res.redirect(`/getCart`)
    } catch (error) {
        console.error("Error:", error.message);
        res.redirect("/pageNotFound");
    }
};



const quatityUpdate = async(req,res)=>{
    const { productId, action } = req.body;
    const userId = req.session.user._id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find((i) => i.productId.toString() === productId);
        if (!item) return res.status(404).json({ message: 'Product not found in the cart.' });
        console.log(item)

        const productDetails = await Product.findById(productId);
        if (!productDetails) return res.status(404).json({ message: 'Product details not found.' });

        if (action === 'increase') {
            if (item.quantity < 5) {
                item.quantity += 1;
                item.totalPrice = item.quantity * productDetails.salePrice;
                await cart.save();
                res.status(200).json({ message: 'Quantity increased successfully.' });
            } else {
                res.status(400).json({ message: 'Maximum quantity of 5 reached.' });
            }
        } else if (action === 'decrease') {
            if (item.quantity > 1) {
                item.quantity -= 1;
                item.totalPrice = item.quantity * productDetails.salePrice;
                await cart.save();
                res.status(200).json({ message: 'Quantity decreased successfully.' });
            } else {
                res.status(400).json({ message: 'Minimum quantity is 1.' });
            }
        }
    } catch (error) {
        console.error('Error updating cart:', error.message);
        res.status(500).json({ message: 'An error occurred while updating the cart.' });
    }
};


const deleteProduct = async(req,res)=>{
    try {
        const productId = req.body;
        const userId = req.session.user._id;
        const cart = await Cart.findOne({userId:userId});
        if(!cart){
            res.status(404).json("Cart not found");
        }

        const item = cart.items.findOneAndDelete((i)=>{
            i.productId.toString()==productId
        });
        if(!item){
            if (!item) return res.status(404).json({ message: 'Product not found in the cart.' });
        };
        if(item){
            res.status(200).json()
        }


    } catch (error) {
        
    }
}
const removeFromCart = async (req, res) => {
    console.log("i came here")
    try {
       const userId = req.session.user;
       const { productId } = req.body;
   
       await Cart.findOneAndUpdate(
           { userId: userId },
           { $pull: { items: { productId: productId } } }
       );
       res.status(200).json({success:true,message:"Remove successfully"});
       }
    catch (error) {
       console.error("Error removing item from cart:", error);
       res.redirect("/pageNotFound");    
    }
   };



//    const productAddToCart = async(req,res)=>{
//     const { productId, quantity } = req.body;

//     // Validate inputs
//     if (!productId || !quantity) {
//         return res.status(400).json({ message: "Product ID and quantity are required." });
//     }

//     try {
//         const user = req.session.user; // Get the logged-in user
//         const cart = await Cart.findOne({ userId: user._id });

//         if (!cart) {
//             // If cart doesn't exist, create a new one
//             const newCart = new Cart({
//                 userId: user._id,
//                 items: [
//                     {
//                         productId,
//                         quantity,
//                         totalPrice: quantity * 250, // Example product price
//                     },
//                 ],
//             });
//             await newCart.save();
//             return res.status(200).json({ message: "Product added to cart successfully!" });
//         } else {
//             // Check if product is already in the cart
//             const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);

//             if (productIndex > -1) {
//                 // Product already exists in the cart
//                 const existingProduct = cart.items[productIndex];
//                 const newQuantity = existingProduct.quantity + quantity;

//                 if (newQuantity > 5) {
//                     return res.status(400).json({
//                         message: "You cannot add more than 5 items of this product.",
//                     });
//                 }

//                 // Update quantity and total price
//                 existingProduct.quantity = newQuantity;
//                 existingProduct.totalPrice = newQuantity * 250; // Example product price
//             } else {
//                 // Add new product to the cart
//                 cart.items.push({
//                     productId,
//                     quantity,
//                     totalPrice: quantity * 250, // Example product price
//                 });
//             }

//             await cart.save();
//             return res.status(200).json({ message: "Product added to cart successfully!" });
//         }
//     } catch (error) {
//         console.error("Error adding to cart:", error);
//         res.status(500).json({ message: "An error occurred. Please try again." });
//     }
//    }


const productAddToCart = async(req,res)=>{
    try{
        if(req.session.user){
               const userId = req.session.user._id;
               const productId = req.query.id;
       
               if (!userId) {
                   return res.redirect('/login');
               }
       
               const product = await Product.findById(productId);
               if (!product) {
                   return res.status(404).send("Product not found");
               }
       
               const quantity = parseInt(req.body.quantity);
               const totalPrice = quantity * product.salePrice;
       
               const cartDoc = await Cart.findOne({ userId: userId });
       
               if (cartDoc) {
                   const existingItemIndex = cartDoc.items.findIndex(item => item.productId.toString() === productId);
                   if (existingItemIndex >= 0) {
                       if(cartDoc.items[existingItemIndex].quantity < 5){
                           cartDoc.items[existingItemIndex].quantity += quantity;
                           cartDoc.items[existingItemIndex].totalPrice += totalPrice;
                       }
                   } else {
                       cartDoc.items.push({ productId, quantity, price: product.salePrice, totalPrice });
                   }
                   await cartDoc.save();
               } else {
                   const newCart = new Cart({
                       userId: userId,
                       items: [{ productId, quantity, price: product.salePrice, totalPrice }]
                   });
                   await newCart.save();
               }
               console.log("Redirecting to cart");
               return res.redirect('/getCart');
       }else{
           res.redirect('/login')
   }
   } catch (error) {
       console.error("Error saving to cart:", error);
       res.status(500).send("Internal Server Error");
   }
}


module.exports = {
    addToCart,
    getCart,
    quatityUpdate,
    deleteProduct,
    removeFromCart,
    productAddToCart,
}