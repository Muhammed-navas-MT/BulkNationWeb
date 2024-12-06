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

const addprodect = async (req, res) => {
    console.log("working add product");
    try {
        const prodects = req.body;

        // Check if product already exists
        // const prodectexists = await Product.findOne({
        //     productName: prodects.productName,
        // });
        const existsProduct = await Product.findOne({
            productName: { $regex: `^${prodects.productName}$`, $options: "i" },
            _id: { $ne: id },
        });

        if (!prodectexists) {
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
            });

            await newProdect.save();
            return res.redirect("/admin/addProdects?success=Product added successfully");
        } else {
            return res.status(400).redirect("/admin/addProdects?error=Product already exists");
        }
    } catch (error) {
        console.error("Error in product add", error);
        return res.redirect("/admin/error");
    }
};


const listProduct = async(req,res)=>{
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


        // if(category && brand){
        //     return res.render("prodectlist",{
        //         data:prodectData,
        //         currentPage:page,
        //         totalPages:page,
        //         firstTotalePage:Math.ceil(count/limit),
        //         cat:category,
        //         brand:brand,
        //     })
        // }else{
        //     res.render("error")
        // }
        return res.render("prodectlist",{data:prodectData,
            cat:category,
            brand:brand,
        })
    } catch (error) {
        console.log("list product error",error);
        res.redirect("/admin/error")
    }
}


const  addProductOffer = async(req,res)=>{
    try {
        const {productId,Percentage} = req.body;
        const findProduct = await Product.findOne({_id:productId});
        const findCategory = await Category.findOne({_id:findProduct.category});

        if(findCategory.categoryOffer>Percentage){
            return res.json({status:false,message:"This products catogory already has a category offer"})
        }

        findProduct.salePrice = findProduct.salePrice.Math.floor(findProduct.regularPrice*(Percentage/100));
        findProduct.productOffer = parseInt(Percentage);
    await findProduct.save();
    findCategory.categoryOffer = 0;
    await findCategory.save();
    res.json({status:true});


    } catch (error) {
            res.redirect("/admin/error");
            res.status(500).json({status:false,message:"Internal Server Error"})
    }
};



const removeProductOffer = async(req,res)=>{
    try {
        const {prodectId} = req.body;
        const findProduct = await Product.findOne({_id:prodectId});
        const Percentage = findProduct.productOffer;
        findProduct.salePrice = findProduct.salePrice+Math.floor(findProduct.regularPrice*(Percentage/100));
        findProduct.productOffer = 0;
        await findProduct.save();
        res.json({status:true})


    } catch (error) {
        res.redirect("/admin/error")
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
        product.productImage = [];
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
}
