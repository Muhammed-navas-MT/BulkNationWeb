const User = require("../../models/userSchema");
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


const loadDashboard = async (req,res)=>{
    try {
        if(req.session.admin){
            return res.render("dashboard");
        }else{
            return res.redirect("/admin/login");
        }
    } catch (error) {
        return redirect("/error");
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
}

module.exports={
    loadLoagin,
    login,
    loadDashboard,
    pageerror,
    logout,
}