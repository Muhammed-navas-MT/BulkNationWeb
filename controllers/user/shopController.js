const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");



const getShopPage = async(req,res)=>{
    console.log("i have came here");
    try {
        const user = req.session.user;
        const categories = await Category.find({isListed:true});
        console.log(categories);
        // const brands = await Brand.find({isBlock:false})
        const products = await Product.find({
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
    }
};


const priceLowToHigh = async(req,res)=>{
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
}


module.exports = {
    getShopPage,
    priceLowToHigh,
    priceHighToLow,
    sortAToZ,
    sortZToA,
    popularityProducts,
    latestProduct,
    categotySort,
}