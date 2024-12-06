const User = require("../models/userSchema");


const userAuth =(req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                req.session.user = null;
                return res.redirect("/signup");
            }
        })
        .catch(error=>{
            console.log("error in user auth middleware",error);
            res.status(500).send("Internal server error");
        })
    }else{
        res.redirect("/signup");
    }
};



const adminAuth = (req,res,next)=>{
    console.log("middleware working");
    const data = req.session.admin;
        if(data){
            next();
        }else{
            res.redirect("/admin/login");
        }
}



module.exports={
    userAuth,
    adminAuth,
}