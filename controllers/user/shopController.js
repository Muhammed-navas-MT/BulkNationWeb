const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const { json } = require("express");





const getShopPage = async (req, res) => {
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlock: false }); 

       
        const searchQuery = req.query.search || "";
        const categoryId = req.query.categoryId || "";
        const brandName = req.query.brandName || ""; 
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        
        const sortOption = req.query.sort;
        let sortCriteria = {};
        if (sortOption === "priceLowToHigh") sortCriteria = { salePrice: 1 };
        else if (sortOption === "priceHighToLow") sortCriteria = { salePrice: -1 };
        else if (sortOption === "aToZ") sortCriteria = { productName: 1 };
        else if (sortOption === "zToA") sortCriteria = { productName: -1 };
        else if (sortOption === "latest") sortCriteria = { createdAt: -1 };
        else if (sortOption === "popularity") sortCriteria = { saleCount: -1 };

      
        const categoryFilter = categoryId ? { category: categoryId } : {};
        const brandFilter = brandName ? { brand: brandName } : {}; 
        const searchFilter = searchQuery
            ? { productName: { $regex: `^${searchQuery}`, $options: "i" } }
            : {};

       
        const filters = {
            isBlocked: false,
            ...categoryFilter,
            ...brandFilter,
            ...searchFilter,
        };

        
        const products = await Product.find(filters)
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(filters);
        const totalPages = Math.ceil(totalProducts / limit);

       
        if (user) {
            const userData = await User.findById(user._id);
            res.render("shop", {
                user: userData,
                products,
                categories,
                brands,
                currentPage: page,
                totalPages,
                sortOption,
                searchQuery,
                categoryId,
                brandName,
                searchQuery,
            });
        } else {
            res.render("shop", {
                user: null,
                products,
                categories,
                brands,
                currentPage: page,
                totalPages,
                sortOption,
                searchQuery,
                categoryId,
                brandName,
                searchQuery,
            });
        }
    } catch (error) {
        console.error(`Shop page error: ${error.message}`);
        res.status(500).redirect("/pageNotFound");
    }
};



module.exports = {
    getShopPage,
}