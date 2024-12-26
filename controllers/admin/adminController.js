const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Order= require("../../models/orderSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { session } = require("passport");


const pageerror =async (req,res)=>{
    return res.render("error");
};



const loadLoagin = async(req,res)=>{
    const msg = req.query.msg || ""
    if(req.session.admin){
       return res.redirect("/admin");
    }
    return res.render("login",{msg});
};

const login= async (req,res)=>{
    try {
        const {email,password} =req.body;
        const admin = await User.findOne({email,isAdmin:true});
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin=true;
                return res.redirect("/admin");
            }else{
                return res.redirect("/admin/login?msg=Password not Match");
            }
        }else{
            return res.redirect("/admin/login?msg=Admin not found");
        }
    }catch (error) {
        console.log("login error",error);
        return res.redirect("/pageerror");
    }
};

const logout =async (req,res)=>{
    console.log("logout working");
    try {
        req.session.admin =null;
        return res.redirect("/admin/login");
    } catch (error) {
        console.log("Unexpeted error during logout");
        res.redirect("/error")
        
    }
};


  const getTopSellingData = async () => {
    try {
        const topProducts = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderedItems.id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$orderedItems.id",
                    totalQuantity: { $sum: "$orderedItems.quantity" },
                    name: { $first: "$orderedItems.name" },
                    category: { $first: "$productDetails.category" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 } 
        ]);

const topCategories = await Order.aggregate([
  { $unwind: "$orderedItems" },
  {
      $lookup: {
          from: "products",
          localField: "orderedItems.id",
          foreignField: "_id",
          as: "productDetails"
      }
  },
  { $unwind: "$productDetails" },
  {
      $lookup: {
          from: "categories",
          localField: "productDetails.category", 
          foreignField: "_id",
          as: "categoryDetails"
      }
  },
  { $unwind: "$categoryDetails" },
  {
      $group: {
          _id: "$categoryDetails._id",
          totalQuantity: { $sum: "$orderedItems.quantity" },
          categoryName: { $first: "$categoryDetails.name" }
      }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 5 } 
]);
        const topBrands = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderedItems.id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.brand",
                    totalQuantity: { $sum: "$orderedItems.quantity" },
                    brandName: { $first: "$productDetails.brand" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        return { topProducts, topCategories, topBrands };
    } catch (error) {
        console.error("Error fetching top-selling data", error);
        return { topProducts: [], topCategories: [], topBrands: [] };
    }
};


const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
};

const getDateRanges = () => {
    const today = new Date();
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const startOfYear = new Date(today.getFullYear(), 0, 1);

    return {
        startOfWeek,
        endOfWeek,
        startOfMonth,
        startOfYear
    };
};


const loadDashboard = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }

        const dateRanges = getDateRanges();

        const orders = await Order.find({})
            .populate("userId", "username")
            .sort({ createdOn: -1 });

        const stats = await Order.aggregate([
                      {
                          $group: {
                              _id: null,
                              totalSalesCount: { $sum: 1 },
                              totalOrderAmount: {
                                  $sum: { $toDouble: { $ifNull: ["$finalAmount", "0"] } }
                              },
                              totalDiscount: {
                                  $sum: { $toDouble: { $ifNull: ["$discount", "0"] } }
                              }
                          }
                      }
                  ]);
                  const { totalSalesCount = 0, totalOrderAmount = 0, totalDiscount = 0 } = stats[0] || {};

         // weekly Sales Data
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: dateRanges.startOfWeek,
                        $lte: dateRanges.endOfWeek
                    },
                    status: { $ne: "Cancelled" }
                }
            },
            {
                $group: {
                    _id: { 
                        $dayOfWeek: "$createdOn"
                    },
                    sales: { 
                        $sum: { $toDouble: "$finalAmount" }
                    },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        // Monthly Sales Data
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    createdOn: { $gte: dateRanges.startOfYear },
                    status: { $ne: "Cancelled" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdOn" },
                        month: { $month: "$createdOn" }
                    },
                    sales: { 
                        $sum: { $toDouble: "$finalAmount" }
                    },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { 
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);

        // Yearly Sales Data
        const yearlySales = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "Cancelled" }
                }
            },
            {
                $group: {
                    _id: { $year: "$createdOn" },
                    sales: { 
                        $sum: { $toDouble: "$finalAmount" }
                    },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": -1 }
            },
            {
                $limit: 5
            }
        ]);

        // Format data for charts
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = {
            labels: daysOfWeek,
            data: Array(7).fill(0),
            orderCounts: Array(7).fill(0)
        };

        dailySales.forEach(item => {
            const dayIndex = item._id - 1;
            weeklyData.data[dayIndex] = formatCurrency(item.sales);
            weeklyData.orderCounts[dayIndex] = item.orderCount;
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = {
            labels: monthNames,
            data: Array(12).fill(0),
            orderCounts: Array(12).fill(0)
        };

        monthlySales.forEach(item => {
            const monthIndex = item._id.month - 1;
            monthlyData.data[monthIndex] = formatCurrency(item.sales);
            monthlyData.orderCounts[monthIndex] = item.orderCount;
        });

        const yearlyData = {
            labels: yearlySales.map(item => item._id.toString()),
            data: yearlySales.map(item => formatCurrency(item.sales)),
            orderCounts: yearlySales.map(item => item.orderCount)
        };

        const paymentStats = await Order.aggregate([
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    total: { 
                        $sum: { $toDouble: "$finalAmount" }
                    }
                }
            }
        ]);

       
        const { topProducts, topCategories, topBrands } = await getTopSellingData();

        // Calculate success rate
        const orderStatusStats = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalOrders = orderStatusStats.reduce((acc, curr) => acc + curr.count, 0);
        const successfulOrders = orderStatusStats.find(stat => stat._id === "Delivered")?.count || 0;
        const orderSuccessRate = totalOrders ? ((successfulOrders / totalOrders) * 100).toFixed(2) : 0;

        // Render dashboard
        console.log("weekly",weeklyData);
        console.log("monthly",monthlyData);
        console.log("yearly",yearlyData);
        return res.render('dashboard', {
            orders,
            // recentOrders,
            totalSalesCount:totalSalesCount,
            totalOrderAmount: totalOrderAmount ,
            totalDiscount: totalDiscount,
            // orderSuccessRate,
            bestSellingProducts: topProducts,
            bestSellingCategories: topCategories,
            bestSellingBrands: topBrands,
            weekly: weeklyData,
            monthly: monthlyData,
            yearly: yearlyData,
            paymentStats,
            // currentMonth: monthNames[new Date().getMonth()],
            // currentYear: new Date().getFullYear()
        });

    } catch (error) {
        console.error("Dashboard error:", error.message);
        return res.redirect('/admin/pageNotFound');
    }
};


module.exports={
    loadLoagin,
    login,
    loadDashboard,
    pageerror,
    logout,
}