const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const { json } = require("express");



const getShopPage = async(req,res)=>{
    console.log("i have came here");
    console.log(req.query.products)
    const productss = req.query.products ? JSON.parse(decodeURIComponent(req.query.products)) : null;
    try {
        const user = req.session.user;
        const categories = await Category.find({isListed:true});
        console.log(categories);
        // const brands = await Brand.find({isBlock:false})
        const products =productss ||await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });

        console.log(products);

        if (user) {
            console.log("1");
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products: products ,categories:categories});
        } else {
            console.log("2");
            res.render("shop", { user: null, products: products,categories:categories});
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    };


    
};

// const getShopPage = async (req, res) => {
//     console.log("I have come here");
//     let search = "";
//     if (req.query.search) {
//         search = req.query.search;
//     }

//     let page = 1;
//     if (req.query.page) {
//         page = parseInt(req.query.page, 10);
//     }

//     const limit = 3;

//     try {
//         // Fetching paginated products
//         const product = await Product.find({
//             isBlocked: false,
//             $or: [
//                 { productName: { $regex: ".*" + search + ".*", $options: "i" } }
//             ],
//         })
//             .limit(limit)
//             .skip((page - 1) * limit)
//             .exec();

//         // Total count of matching products
//         const count = await Product.countDocuments({
//             isBlocked: false,
//             $or: [
//                 { productName: { $regex: ".*" + search + ".*", $options: "i" } }
//             ],
//         });

//         const totalPage = Math.ceil(count / limit);

//         // Additional data fetch
//         const user = req.session.user;
//         const categories = await Category.find({ isListed: true });

//         const products = await Product.find({
//             isBlocked: false,
//             category: { $in: categories.map((category) => category._id) }
//         });

//         console.log(products);

//         // Rendering the shop page
//         if (user) {
//             console.log("1");
//             const userData = await User.findById(user._id);
//             res.render("shop", {
//                 user: userData,
//                 products: products,
//                 categories: categories,
//                 totalPage: totalPage,
//                 currentPage: page,
//             });
//         } else {
//             console.log("2");
//             res.render("shop", {
//                 user: null,
//                 products: userData,
//                 categories: categories,
//                 totalPage: totalPage,
//                 currentPage: page,
//             });
//         }
//     } catch (error) {
//         console.error(`Shop page error: ${error.message}`);
//         res.status(500).redirect("/pageNotFound");
//     }
// };



const priceLowToHigh = async(req,res)=>{
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });
    
        products.sort((a, b) => a.salePrice - b.salePrice);
    
        console.log('Sorted Products:', products);
    
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products: products ,categories:categories});
        } else {
            res.render("shop", { user: null, products: products ,categories:categories});
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
    
};

const priceHighToLow = async(req,res)=>{
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });
    
        products.sort((a, b) => b.salePrice - a.salePrice);
    
        console.log('Sorted Products:', products);
    
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products: products,categories:categories });
        } else {
            res.render("shop", { user: null, products: products ,categories:categories});
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
    
};

const sortAToZ = async (req, res) => {
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });
        const sortedProducts = products.sort((a, b) => {
            const nameA = a.productName.toLowerCase();
            const nameB = b.productName.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products: sortedProducts ,categories:categories});
        } else {
            res.render("shop", { user: null, products: sortedProducts ,categories:categories});
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
};

const sortZToA = async (req, res) => {
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });
        const sortedProducts = products.sort((a, b) => {
            const nameA = a.productName.toLowerCase();
            const nameB = b.productName.toLowerCase();
            return nameB.localeCompare(nameA);
        });
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products: sortedProducts,categories:categories});
        } else {
            res.render("shop", { user: null, products: sortedProducts ,categories:categories});
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
};

const popularityProducts = async(req,res)=>{
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });
    
        products.sort((a, b) => a.salePrice - b.salePrice);
        const limitedProducts = products.slice(0, 5);
    
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products: limitedProducts,categories:categories });
        } else {
            res.render("shop", { user: null, products: limitedProducts,categories:categories });
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
};


const latestProduct = async(req,res)=>{
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) }
        });
    
        products.sort((a, b) => b.createdAt - a.createdAt);
       
    
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products:  products,categories:categories});
        } else {
            res.render("shop", { user: null, products:  products,categories:categories});
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
};

const categotySort= async(req,res)=>{
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const user = req.session.user;
        const id = req.query.id;
        const category = await Category.find({isListed:true,_id:id});
        const categories = await Category.find({isListed:true});
        const products = await Product.find({
            isBlocked: false,
            category: { $in: category.map(category => category._id) }
        });
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", { user: userData, products: products ,categories:categories});
        } else {
            res.render("shop", { user: null, products: products,categories:categories});
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
};

// Controller to search products
const searchProducts = async (req, res) => {
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
        page = parseInt(req.query.page, 10);
    }

    const limit = 3;
    try {
        const query = req.query.query; // Get the search query from the URL
        console.log(query);
        const user = req.session.user;
        const categories = await Category.find({isListed:true});
        if (!query) {
          
        }

        // Case-insensitive search using regular expressions
        const products = await Product.find({
            productName: { $regex: `^${query}`, $options: 'i' } // '^' matches the beginning of the string
        });
        
        const productsString = JSON.stringify(products);
        const encodedProducts = encodeURIComponent(productsString);
        if (products.length === 0) {
            return res.redirect("/shopPage");
        }
        if (user) {
            const userData = await User.findById(user._id);
            return res.redirect(`/shopPage?products=${encodedProducts}`);
        } else {
            return res.redirect(`/shopPage?products=${encodedProducts}`);
        }
    } catch (error) {
        console.error('Error searching products:', error);
       res.redirect("/pageNotFound");
    }
};


module.exports = {
    getShopPage,
    priceLowToHigh,
    priceHighToLow,
    sortAToZ,
    sortZToA,
    popularityProducts,
    latestProduct,
    categotySort,
    searchProducts,
}