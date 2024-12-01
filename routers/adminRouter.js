const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController= require("../controllers/admin/customerController");
const categoryController =require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController");
const prodectController = require("../controllers/admin/prodectController");
const adminAuth = require("../middlewares/auth");
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads =multer({storage:storage});



router.get("/",adminAuth.adminAuth,adminController.loadDashboard);
router.get("/login",adminController.loadLoagin);
router.post("/login",adminController.login);
router.get("/logout",adminController.logout);
 router.get("/error",adminController.pageerror);

// customers management
router.get("/users",adminAuth.adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth.adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth.adminAuth,customerController.customeUnBlocked);

// category Management
router.get("/category",adminAuth.adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth.adminAuth,categoryController.addCategory);
router.post("/addCategoryOffer",adminAuth.adminAuth,categoryController.addCategoryOffer);
router.post("/removeCategoryOffer",adminAuth.adminAuth,categoryController.removeCategoryOffer);
router.get("/listCategory",adminAuth.adminAuth,categoryController.listCategory);
router.get("/unlistCategory",adminAuth.adminAuth,categoryController.unlistCategory);
router.get("/editCategory", adminAuth.adminAuth, categoryController.loadEditCategory);
router.post("/editCategory/:id",adminAuth.adminAuth,categoryController.editCategory);
// router.delete("/deleteCategory/:id",adminAuth.adminAuth,categoryController.deleteCategory);


// brand Management
router.get("/brands",adminAuth.adminAuth,brandController.getBrandPage);
router.post("/addBrand",uploads.single("brandImage"),brandController.addBrand);
router.get("/blockbrand",adminAuth.adminAuth,brandController.blockbrand);
router.get("/unblockbrand",adminAuth.adminAuth,brandController.unblockbrand);
router.delete("/deletebrand/:id", adminAuth.adminAuth, brandController.deleteBrand);
router.post("/updateBrand",uploads.single("logo"),adminAuth.adminAuth,brandController.updateBrand);



// prodect manegement 
router.get("/addProdects",adminAuth.adminAuth,prodectController.getProdectAddpage);
router.post("/addProdects",adminAuth.adminAuth,uploads.array("images",4),prodectController.addprodect);
router.get("/product",adminAuth.adminAuth,prodectController.listProduct);
router.post("/addProductOffer",adminAuth.adminAuth,prodectController.addProductOffer);
router.post("/removeProductOffer",adminAuth.adminAuth,prodectController.removeProductOffer);
router.get("/blockProduct",adminAuth.adminAuth,prodectController.blockProduct);
router.get("/unblockProduct",adminAuth.adminAuth,prodectController.unblockProduct);
router.get("/editProduct",adminAuth.adminAuth,prodectController.editProduct);
router.post("/editProduct",adminAuth.adminAuth,uploads.array("images",4),prodectController.updateproduct)






module.exports = router;