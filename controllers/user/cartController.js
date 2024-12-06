
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");






const getCart = async (req, res) => {
    try {
        const user = req.session.user;

        if (!user) {
            return res.redirect("/login");
        }

        const findUserCart = await Cart.findOne({ userId: user._id }).populate(
            "items.productId" 
        );

        if (!findUserCart || findUserCart.items.length === 0) {
            return res.render("cart", { products: [], user: user, cartPrice: 0, message: "Your cart is empty." });
        }

        const totalCartPrice = findUserCart.items.reduce((sum, item) => sum + item.totalPrice, 0);

        const products = findUserCart.items
            .map((item) => {
                if (!item.productId) {
                    console.warn(`Product with ID ${item.productId} is missing or deleted.`);
                    return null; 
                }

                return {
                    product: item.productId, 
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                };
            })
            .filter((product) => product !== null);

        res.render("cart", { products: products, user: user, cartPrice: totalCartPrice });
    } catch (error) {
        console.error("Error fetching cart:", error.message);
        res.redirect("/pageNotFound");
    }
};







const addToCart = async (req, res) => {
    try {
        const quantity = parseInt(req.query.quantity) || 1;
        const productId = req.query.id;
        const user = req.session.user;

        if (!user) {
            return res.redirect("/login");
        }

        let findCart = await Cart.findOne({ userId: user._id });

        if (!findCart) {
            const productDetails = await Product.findById(productId); 
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
        } else {
            const existingProduct = findCart.items.find(
                (item) => item.productId.toString() === productId
            );

            if (existingProduct) {
                const unitPrice = existingProduct.totalPrice / existingProduct.quantity;
            
                if(existingProduct.quantity >= 5)return res.redirect('/getCart')
                existingProduct.quantity += quantity;
            
                existingProduct.totalPrice += unitPrice * quantity;
            } else {
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

const removeFromCart = async (req, res) => {
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
                       }else{
                        return res.redirect('/getCart');
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
    removeFromCart,
    productAddToCart,
}