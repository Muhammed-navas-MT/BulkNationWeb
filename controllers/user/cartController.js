
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Wishlist = require("../../models/wishlistSchema")
const { productDetails } = require("./productController");



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

        const totalCartPrice = findUserCart.items.reduce((sum, item) => {
            if (item.productId && !item.productId.isBlocked) {
                return sum + item.totalPrice;
            }
            return sum; // Ignore blocked products
        }, 0);

        const products = findUserCart.items
            .map((item) => {
                if (!item.productId) {
                    console.warn(`Product with ID ${item.productId} is missing or deleted.`);
                    return null; 
                }

                if (item.productId.isBlocked) {
                    console.warn(`Product with ID ${item.productId._id} is blocked.`);
                    return null; // Exclude blocked products
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
        const msg = req.query.msg || null;
        const user = req.session.user;

        
        if (!user) {
            return res.redirect("/login");
        };

        if (msg === "delete") {
            console.log("delete.messsage",msg);
            let findWishlist = await Wishlist.findOne({ userId: user._id });
            const existingProduct =  findWishlist.products.find(
                (item) => item.productId.toString() === productId
            );
            console.log(productId,"this is a product id",existingProduct,"this is a existingproduct");

        
            if (existingProduct) {
                console.log("remove product");
                const wishlist = await Wishlist.updateOne(
                    { userId: user._id },
                    { $pull: { products: { productId: productId } } }
                );
            }
        };
        
        


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
                if(productDetails.quantity>=existingProduct.quantity){
                const unitPrice = existingProduct.totalPrice / existingProduct.quantity;
            
                if(existingProduct.quantity >= 5)return res.redirect('/getCart')
                existingProduct.quantity += quantity;
            
                existingProduct.totalPrice += unitPrice * quantity;
               }else{
               return res.redirect(`/getCart`)
               }
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
        console.log("Error:", error.message);
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
            const totalQuatity = item.quantity + 1;
            if(productDetails.quantity>=totalQuatity){
              
            }else{
                return res.status(400).json({ message: 'Invalid action or quantity limit reached.' });
            }

            
            if (item.quantity < 5 ){
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
                    const totalQuatity =  cartDoc.items[existingItemIndex].quantity + quantity;
                       if(cartDoc.items[existingItemIndex].quantity < 5 && product.quantity >=totalQuatity){
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
};



const addCart = async(req,res)=>{
    console.log("hello came add product to cart");
    try {
        const quantity = parseInt(req.query.quantity) || 1;
        const user = req.session.user || null ;
        const productId = req.body.productId;
        const msg = req.query.msg || null;
        console.log(user);
        console.log(productId);
        console.log(msg);

        if (user === null) {
            return res.redirect("/signup");
        };

        if (msg === "delete") {
            console.log("delete.messsage",msg);
            let findWishlist = await Wishlist.findOne({ userId: user._id });
            const existingProduct =  findWishlist.products.find(
                (item) => item.productId.toString() === productId
            );
            console.log(productId,"this is a product id",existingProduct,"this is a existingproduct");

        
            if (existingProduct) {
                console.log("remove product");
                const wishlist = await Wishlist.updateOne(
                    { userId: user._id },
                    { $pull: { products: { productId: productId } } }
                );
            }
        };
        

        let findCart = await Cart.findOne({ userId: user._id });

        if (!findCart) {
            const productDetails = await Product.findById(productId); 
            if (!productDetails) {
                return res.status(404).json({success:false,message:"Product not found"})
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
                if(productDetails.quantity>=existingProduct.quantity){
                const unitPrice = existingProduct.totalPrice / existingProduct.quantity;
            
                if(existingProduct.quantity >= 5)return res.status(400).json({success:false,message:"Quatity full"})
                existingProduct.quantity += quantity;
            
                existingProduct.totalPrice += unitPrice * quantity;
               }else{
               return res.status(404).json({success:false,message:"Product all ready Existed in Cart"});
               }
            } else {
                const productDetails = await Product.findById(productId);
                if (!productDetails) {
                    return res.status(404).json({success:false,message:"Product not found"})
                }
            
                findCart.items.push({
                    productId: productId,
                    totalPrice: productDetails.salePrice * quantity,
                    quantity: quantity,
                });
            }
            
            await findCart.save();
        };
        return res.status(200).json({success:true,message:"Product add to Cart successfully"})
    } catch (error) {
        console.log("Error:", error.message);
        res.status(500).json({success:false,message:"Internal Server Error"})
    }
};

module.exports = {
    addToCart,
    getCart,
    quatityUpdate,
    removeFromCart,
    productAddToCart,
    addCart,
}