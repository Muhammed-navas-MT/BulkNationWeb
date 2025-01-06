const User = require("../../models/userSchema");

// Search users in database 
const customerInfo = async (req, res) => {
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
          }
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        
        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page, 10);
        }

        const limit = 5;
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { username: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        })
        .sort({ _id: -1 }) 
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { username: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        });

        const totalPage = Math.ceil(count / limit);

    
        res.render("users", { data: userData, totalPage: totalPage, currentPage: page });

    } catch (error) {
        console.log("Error fetching users:", error);
        return res.redirect("/error");
    }
};
const customerBlocked = async (req,res)=>{
    try {
        let id=req.query.id;
        const user  = await User.findOne({_id:id});
        await User.updateOne({_id:id},{$set:{isBlocked:true}});
        const u = req.session.user || null;
        if(u!== null){
           if(id === u._id){
           req.session.user = null;
           }
        }
        return res.status(200).json({success:true,message:"user block successfully"});
    } catch (error) {
        console.log("error block ",error.message)
        return res.status(500).json({success:false,message:"Internal server error"});
    }
};

const customeUnBlocked = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
       return res.status(200).json({success:true,message:"user block successfully"});
    } catch (error) {
       return res.status(500).json({success:false,message:"Internal server error"});
    }
}

module.exports = {
    customerInfo,
    customerBlocked,
    customeUnBlocked,
};
