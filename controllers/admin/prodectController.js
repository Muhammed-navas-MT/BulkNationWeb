const prodect = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const Product = require("../../models/productSchema");
const { status } = require("init");
const { query } = require("express");
const { error } = require("console");



const getProdectAddpage = async(req,res)=>{
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
          }
        const success = req.query.success || "";
        const error = req.query.error || "";
        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlock:false});
        res.render("prodectaddpage",{
            cat:category,
            brand:brand,
            success:success,
            error:error,

        })
    } catch (error) {
        res.redirect("/admin/error");
    }
};

// const getProdectAddpage = async (req, res) => {
//     try {
//         if (!req.session.admin) {
//             return res.redirect("/admin/login");
//         }

//         const success = req.query.success || "";
//         const error = req.query.error || "";

//         // Fetch categories and brands
//         const categories = await Category.find({ isListed: true });
//         const brands = await Brand.find({ isBlock: false });

//         // Fetch all products
//         const products = await Product.find();

//         // Iterate through products and update sale prices based on category offers
//         for (const product of products) {
//             const category = categories.find(cat => cat._id.equals(product.category));
//             if (category && category.categoryOffer) {
//                 const discountAmount = Math.floor(product.regularPrice * (category.categoryOffer / 100));
//                 const newSalePrice = product.regularPrice - discountAmount;

//                 // Update sale price and save old price if necessary
//                 if (newSalePrice < product.salePrice) {
//                     product.oldPrice = product.salePrice; // Save the current sale price as old price
//                     product.salePrice = newSalePrice;     // Update with the new sale price
//                     console.log(`Updated sale price for product ${product.name}: ${product.salePrice}, Old Price: ${product.oldPrice}`);
//                     await product.save();
//                 }
//             }
//         }

//         // Render the product add page
//         res.render("prodectaddpage", {
//             cat: categories,
//             brand: brands,
//             success: success,
//             error: error,
//         });
//     } catch (error) {
//         console.error("Error in getProductAddPage:", error);
//         res.redirect("/admin/error");
//     }
// };


const addprodect = async (req, res) => {
    try {
        const prodects = req.body;
        console.log(prodects);

        // Check if product already exists
        const existsProduct = await Product.findOne({
            productName: { $regex: `^${prodects.productName}$`, $options: "i" }
        });

        if (! existsProduct) {
            const images = [];
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path; 
                    console.log("original image path", originalImagePath);

                    const resizedImagePath = path.join(
                        "public",
                        "uploads",
                        "re-images",
                        req.files[i].filename 
                    );

                    images.push(req.files[i].filename); 
                }
            }

            const categoryId = await Category.findOne({ name: prodects.category });

            if (!categoryId) {
                return res.status(400).json("Invalid category name");
            }

            // Create a new product
            const newProdect = new Product({
                productName: prodects.productName, 
                description: prodects.description,
                brand: prodects.brand,
                category: categoryId._id,
                regularPrice: prodects.regularPrice,
                salePrice: prodects.salePrice,
                createdAt: Date(),
                quantity: prodects.quantity,
                size: prodects.size,
                flavor: prodects.flavor,
                productImage: images,
                status: "Available",
                oldPrice: prodects.salePrice,
            });

            await newProdect.save();
            return res.redirect("/admin/product");
        } else {
            return res.status(400).redirect("/admin/addProdects?error=Product already exists");
        }
    } catch (error) {
        console.error("Error in product add", error);
        return res.redirect("/admin/error");
    }
};


const listProduct = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect("/admin/login");
        }

        const page = parseInt(req.query.page, 10) || 1; 
        const limit = 20; 
        const skip = (page - 1) * limit;


        const productData = await Product.find()
            .populate('category')
            .skip(skip)
            .limit(limit);



            for (const product of productData) {
                if (product.category && product.category.categoryOffer) {
                    const discountAmount = Math.floor(product.regularPrice * (product.category.categoryOffer / 100));
                    const newSalePrice = product.regularPrice - discountAmount;
    
                    
                    if (newSalePrice < product.salePrice) {
                       
                        product.salePrice = newSalePrice;    
                        console.log(`Updated sale price for product ${product.productName}: ${product.salePrice}, Old Price: ${product.oldPrice}, new sale price${newSalePrice}`);
                        await product.save();
                    }
                }
            }
    

        const totalProducts = await Product.countDocuments();

        const totalPages = Math.ceil(totalProducts / limit);

        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlock: false });

        return res.render("prodectlist", {
            data: productData,
            cat: category,
            brand: brand,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.log("list product error", error);
        res.redirect("/admin/error");
    }
};



async function addProductOffer(req, res) {
    try {
        const { productId, percentage } = req.body;
        console.log(productId,percentage);

        if (!productId || !percentage || percentage <= 0 || percentage > 100) {
            console.log("Invalid product id");
            return res.status(400).json({ status: false, message: "Invalid product ID or percentage" });
        }

        const findProduct = await Product.findById(productId);

        if (!findProduct) {
            console.log("product not found");
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        const findCategory = await Category.findById({_id:findProduct.category});
        console.log("findcategory",findCategory);


        findProduct.productOffer = percentage;
     
      // Determine the greater percentage between category offer and product offer
      const effectiveOffer = findCategory && findCategory.offer > percentage 
          ? findCategory.offer 
          : percentage;

      console.log("Effective Offer Used for Calculation:", effectiveOffer);

      const discountAmount = Math.floor(findProduct.regularPrice * (effectiveOffer / 100));
      const lessthanDiscountAmount = findProduct.regularPrice - discountAmount;

      // Validate that the discounted price is less than the sale price
      if (lessthanDiscountAmount > findProduct.salePrice) {
          console.log("Discounted price is not less than the sale price.");
          return res.status(404).json({ success: false, message: "Discounted price cannot be higher than the sale price" });
      }
      
      // Update prices, but keep the product offer unchanged
    //   findProduct.oldPrice = findProduct.salePrice;
      findProduct.salePrice = lessthanDiscountAmount;

      console.log("New Sale Price:", findProduct.salePrice, "Effective Offer Used:", effectiveOffer);
      await findProduct.save();


              return res.status(200).json({ status: true, message: "Offer added successfully", product: findProduct });
          } catch (error) {
             console.error("Error in addProductOffer:", error);
              res.status(500).json({ status: false, message: "An error occurred while adding the offer" });
          }
    }





const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ status: false, message: "Invalid product ID" });
        }

        const findProduct = await Product.findById(productId);
        if (!findProduct) {
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        // Check if there's an active offer
        const percentage = findProduct.productOffer;
        if (!percentage || percentage <= 0) {
            return res.status(400).json({ status: false, message: "No active offer to remove" });
        }

        // Recalculate the sale price
        // const discountAmount = Math.floor(findProduct.regularPrice * (percentage / 100));
        findProduct.salePrice = findProduct.oldPrice;
        findProduct.productOffer = 0; 

        await findProduct.save();

        res.status(200).json({ status: true, message: "Offer removed successfully" });
    } catch (error) {
        console.error("Error in removeProductOffer:", error);
        res.status(500).json({ status: false, message: "An error occurred while removing the offer" });
    }
};


const blockProduct =async(req,res)=>{
    console.log("hello")
    try {
        const id = req.query.id;
    await Product.updateOne({_id:id},{$set:{isBlocked:true}});
     return res.redirect("/admin/product");
    } catch (error) {
      return  res.redirect("/admin/error");
    }
}


const unblockProduct =async(req,res)=>{
    console.log("heyyy");
    try {
        const id = req.query.id;
    await Product.updateOne({_id:id},{$set:{isBlocked:false}});
      return res.redirect("/admin/product");
    } catch (error) {
      return  res.redirect("/admin/error");
    }
}


const editProduct = async(req,res)=>{
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
          }
        const id = req.query.id;
        const product = await Product.findOne({_id:id}) || req.query.product;
        const category = await Category.find({isListed:true}) || req.query.cat;
        const brand = await Brand.find({isBlock:false})|| req.query.brand;
        const msg = req.query.msg || "";
        console.log(product);
        res.render("editProduct",{
            product:product,
            cat:category,
            brand:brand,
            msg:msg,
        })
        
    } catch (error) {
        res.redirect("/admin/error");
    }
}

const updateproduct = async(req,res)=>{
    console.log("navAAD");
    try {
       const id = req.query.id;
       const product = await Product.findOne({_id:id});
       const data = req.body;

    //    const existsProduct = await Product.findOne({
    //     productName:data.productName,
    //     _id:{$ne:id}
    //    });
    const existsProduct = await Product.findOne({
        productName: { $regex: `^${data.productName}$`, $options: "i" },
        _id: { $ne: id },
    });
       const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlock:false});

       if(existsProduct){
        return res.status(404).redirect(`/admin/editProduct?msg= This Product name already exists& product=${existsProduct}&cat=${category}&brand=${brand}`);
       }

       const image = [];
       if (product) {
        // product.productImage = [];
        await product.save();
        }
       if(req.files && req.files.length>0){
        for(let i=0;i<req.files.length;i++){
            image.push(req.files[i].filename);
        }
       }

       const updatefilds = {
        productName:data.productName,
        description:data.description,
        brand:data.brand,
        category:product.category,
        regularPrice:data.regularPrice,
        salePrice:data.salePrice,
        quantity:data.quantity,
        flavor:data.flavor,
        size:data.size,
       }
       if(req.files.length>0){
        updatefilds.$push = {productImage:{$each:image}};
       }

       await Product.findByIdAndUpdate(id,updatefilds,{new:true});
       return res.redirect("/admin/product");
    } catch (error) {
        console.log("edit product error",erro);
        return res.redirect("/admin/error");
    }
};


const deleteImage = async(req,res)=>{
    try {
        const {imageIdToServer,productIdToServer}= req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageIdToServer}});
        const imagePath = path.join("public","uploads","re-image",imageIdToServer);
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`image ${imageIdToServer} Delete successfully`);
            res.status(200).json({success:true,message:"Image updated successfully"})
        }else{
            console.log(`image not found ${imageIdToServer}`);
            res.status(400).json({success:false,message:"Image Path not found"})
        }
    } catch (error) {
        console.log("single image delete error",error);
        res.status(500).json({success:false,message:"Internal Server Error"})
    }
};



const ProductStockManagement= async(req,res)=>{
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
          }
        // const search = req.query.search || "";
        // const page = req.query.page || 1;
        // const limit = 6;
        const prodectData = await Product.find().populate('category')

        // const count = await Product.find({
        //     $or:[
        //         {productName:{$regex:new RegExp(".*"+search+".*","i")}},
        //         {brand:{$regex:new RegExp(".*"+search+".*","i")}},
        //     ],
        // }).countDocuments();


        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlock:false});

        return res.render("stockMenagenent",{data:prodectData,
            cat:category,
            brand:brand,
        })
    } catch (error) {
        console.log("list product error",error);
        res.redirect("/admin/error")
    }
};

const postStock = async(req,res)=>{
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
        return res.status(400).json({ status: false, message: "Invalid data" });
    }

    try {
        // Update the product in the database
        const product = await Product.findByIdAndUpdate(
            productId,
            { quantity: Number(quantity) },
            { new: true }
        );

        if (product) {
            res.json({ status: true, message: "Quantity updated", currentQuantity: product.quantity });
        } else {
            res.status(404).json({ status: false, message: "Product not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
}




module.exports = {
    getProdectAddpage,
    addprodect,
    listProduct,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    editProduct,
    updateproduct,
    deleteImage,
    ProductStockManagement,
    postStock,
}
