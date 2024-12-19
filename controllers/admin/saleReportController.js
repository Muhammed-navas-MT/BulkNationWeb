const Order = require("../../models/orderSchema"); 



const getsales = async(req,res)=>{
    try {
        const orders = await Order.find({})
          .populate("userId", "username") 
          .sort({ createdOn: -1 }); 


          const stats = await Order.aggregate([
            {
              $group: {
                _id: null,
                totalSalesCount: { $sum: 1 },
                totalOrderAmount: {
                  $sum:{ $toDouble:{ $ifNull:["$finalAmount","0"]}} 
                },
                totalDiscount: {
                  $sum:{$toDouble:{$ifNull:["$discount","0"]}}
                }
              }
            }
          ]);
          
          const { totalSalesCount = 0, totalOrderAmount = 0, totalDiscount = 0 } = stats[0] || {};

          console.log(stats);
        res.render("salesReport", { 
          orders,
          totalSalesCount,
          totalOrderAmount,
          totalDiscount,

        }); 
      } catch (error) {
        console.error("Error fetching sale report:", error);
        res.status(500).send("Failed to load sale report.");
      }
}

const generateReport = async (req, res) => {
    try {
      const { quickSelect, startDate, endDate } = req.query;
      console.log("Query Parameters:", quickSelect, startDate, endDate);
  
      let filter = {};
  
      if (quickSelect) {
        const days = parseInt(quickSelect, 10);
  
        if (days === 1) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const now = new Date(); 
          filter.createdOn = { $gte: today, $lt: now };
        } else if (days === 7) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          filter.createdOn = { $gte: lastWeek, $lt: today };
        } else if (days === 30) {
          const today = new Date();
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1); 
          const now = new Date();
          filter.createdOn = { $gte: monthStart, $lt: now };
        } else if (days === 365) {
          const today = new Date();
          const yearStart = new Date(today.getFullYear(), 0, 1); 
          const now = new Date(); 
          filter.createdOn = { $gte: yearStart, $lt: now };
        } else {
          const date = new Date();
          date.setDate(date.getDate() - days);
          filter.createdOn = { $gte: date };
        }
      }
  
      if (startDate && endDate) {
        filter.createdOn = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      const orders = await Order.find(filter)
      .populate("userId", "username") 
      .sort({ createdOn: -1 });

      const stats = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalSalesCount: { $sum: 1 },
            totalOrderAmount: {
              $sum:{ $toDouble:{ $ifNull:["$finalAmount","0"]}} 
            },
            totalDiscount: {
              $sum:{$toDouble:{$ifNull:["$discount","0"]}}
            }
          }
        }
      ]);

      const { totalSalesCount = 0, totalOrderAmount = 0, totalDiscount = 0 } = stats[0] || {};
      
      res.json({ 
        success: true, 
        orders,
        totalSalesCount,
        totalOrderAmount,
        totalDiscount,
});
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
  };  


  
module.exports = { 
    generateReport ,
    getsales,
};
