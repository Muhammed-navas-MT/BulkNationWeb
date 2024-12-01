const User = require("../models/userSchema");


const userAuth =(req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
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
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect("/admin/login");
        }
    })
    .catch(error=>{
    console.log("Error in adminAuth middleware",error);
    res.status(500).send("Internal Server Error");
    })
}



module.exports={
    userAuth,
    adminAuth,
}