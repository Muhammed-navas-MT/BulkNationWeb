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
        console.log(u);
        if(u!== null){
           if(id === u._id){
           req.session.user = null;
           console.log("hey working");
           }
        }
        return res.redirect("/admin/users");
    } catch (error) {
        console.log("error block ",error.message)
       res.redirect("/error");
    }
};

const customeUnBlocked = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
       return res.redirect("/admin/users");
    } catch (error) {
       return res.redirect("/error");
    }
}

module.exports = {
    customerInfo,
    customerBlocked,
    customeUnBlocked,
};
