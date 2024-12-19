const { PassThrough } = require("nodemailer/lib/xoauth2");
const User = require("../../models/userSchema");
const env =require("dotenv").config();
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const nodeMailer =require("nodemailer");
const bcrypt =require("bcrypt");

const securePassword =async (password)=>{
    try {
        const passwordHash =await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log("password bcrypt error",error);
    }
}

const pageNotFound=async (req,res)=>{
    try {
      return res.render("page-404")
    } catch (error) {
       return res.redirect("/pageNotFound")
    }
}

// load home page
const loadHomePage = async (req, res) => {

    try {console.log(req.session)

        const user = req.session.user || req.session?.passport?.user;
        const categories = await Category.find({ isListed: true });
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
            // quantity: { $gt: 0 },
        });

        

        if (user) {
            const userData = await User.findById(user._id);
            console.log(userData);
            res.render("home", { user: userData, products: products });
        } else {
            console.log("No user data");
            res.render("home", { user: null, products: products});
        }
    } catch (error) {
        console.error(`Home page error: ${error.message}`);
        res.status(500).send("Server error");
    }
};

// load signup page
const loadsignup = async (req,res)=>{
    try {
        const user = req.session.user;
        const message = req.query.message;
            const msg = req.query.msg;
        if(!user){
                return  res.render("signup",{message,msg});
        }else{
            return res.redirect("/");
        }
       
    } catch (error) {
        console.log("signup not found");
       return res.status(500).send("servere Error");
    }
};

function generateOtp (){
    return Math.floor(1000 + Math.random()*9000).toString();
};



async function sendVerificationEmail(email,otp) {
    try {
        console.log("user email",email);
        console.log("user OTP",otp);
        const transporter = nodeMailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,//process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,//process.env.NODEMAILER_PASSWOR
            }
        });

        const info  =await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,//process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"verify your account",
            text:`Your OTP is ${otp}`,
            html:`<b>Your OTP: ${otp}</b>`
        });

        return info.accepted.length>0
    } catch (error) {
        console.error("error send email",error);
        return false;
    }
};

const signup = async (req,res)=>{
    try {
        const {username,phone,email,password,cpassword} = req.body;

        if (!email) {  
            console.error("Email is missing in request body.");
            return res.status(400).send("Email is required.");
        }

        if(password !== cpassword){
            // return res.render("signup",{msg:"password do not match",message:""});
            return res.redirect("/signup?msg=password do not match & message=''")
        }
        const findUser = await User.findOne({ email });
        if(findUser){
            // return res.render("signup",{msg:"User with this email already exists",message:""});
             return res.redirect("/signup?msg=User with this email already exists & message='' ")
        }

        const otp = generateOtp();
        console.log("Sending OTP to email:", email);  
        console.log("Generated OTP:", otp);

        const emailSent = await sendVerificationEmail(email,otp);
        if(!emailSent){
            
            return res.json("email-error");
        };

        req.session.userOtp =otp;
        setTimeout(() => {
            req.session.userOtp = null;
            console.log("OTP expired");
        }, 60 * 1000); 
        req.session.userData ={username,phone,email,password};

        return res.render("otp");
    } catch (error) {
        console.error("signup error",error);
       return res.redirect("/pageNotFound");
    }
};


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log("Received OTP from client:", otp);
       
        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            console.log("User data found in session:", user); 

           
            const passwordHash = await securePassword(user.password);

            
            const saveUserData = new User({
                username: user.username,
                email: user.email,
                phone: user.phone,
                password: passwordHash
            });
            await saveUserData.save();
            console.log("User data saved successfully.");

            
            req.session.user = saveUserData;
            res.json({ success: true });

        } else {
            console.warn("Invalid OTP attempt:", otp); 
            res.status(400).json({ success: false, message: "Invalid OTP, try again" });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error); 
        res.status(500).json({ success: false, message: "An error occurred" });
    }
};


// resent otp function defanition
const resendOtp = async (req, res) => {
    try {
        const email = req.session.userData?.email;
        
        if (!email) {
            return res.status(400).json({ success: false, message: "No email found in session. Please start the signup process again." });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again later." });
        }

        req.session.userOtp = otp;
        setTimeout(() => {
            req.session.userOtp = null;
            console.log("OTP expired");
        }, 60 * 1000); 
        res.json({ success: true, message: "OTP resent successfully" });
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while resending OTP" });
    }
};

const verifyLogin = async (req,res)=>{    
    try {
        const {email,password} = req.body;

    const findUser = await User.findOne({isAdmin:0,email:email});

    if(!findUser){
        return res.redirect("/signup?message=User not found&msg=");
    }
    if(findUser.isBlocked){
        return res.redirect("/signup?message=User is blocked admin&msg=");
    }

    const passwordMatch = await bcrypt.compare(password,findUser.password);

    if(!passwordMatch){
        return res.redirect("/signup?message=Incorrect Password&msg=")
    }
    req.session.user = findUser;
     return res.redirect("/");
    } catch (error) {
        console.error(error);
       return res.redirect("/signup?message=login failed. please try again later&msg=")
        
    }
}

const loguot = async (req,res)=>{
    try {
        req.session.user = null;
        req.session.passport = null;
        return res.redirect("/");
    } catch (error) {
        
    }
}


module.exports={
    loadHomePage,
    pageNotFound,
    loadsignup,
    signup,
    verifyOtp,
    resendOtp,
    verifyLogin,
    loguot,
}
