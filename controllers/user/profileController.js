const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const SendmailTransport = require("nodemailer/lib/sendmail-transport");
const e = require("express");



const  securePassword =async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        
    }
}

function generateOtp (){
    const digit ="1234567890";
    let otp ="";
    for(let i=0;i<4;i++){
        otp +=digit[Math.floor(Math.random()*10)]
    }
    return otp;
}

const sendVerificationEmail = async(email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,
            }
        })

const mailOption ={
    from:process.env.NODEMAILER_EMAIL,
    to:email,
    subject:"you OTP for password reset",
    text:`Your OTP id ${otp}`,
    html:`<b><h2>Your OTP :${otp}</h2></b>`
}

const info = await transporter.sendMail(mailOption);
console.log("Email send OTP",info.messageId);
return true;


    } catch (error) {
        console.error("error send email return false",error)
    }
}


const getemail = async(req,res)=>{
    try {
        console.log("this working")
        res.render("email");
    } catch (error) {
        res.redirect("/pageNotFound");
    }
}

const Forgotemail = async (req,res)=>{
    console.log('that working')
    try {
        console.log("that this working");
        const {email} = req.body;
        console.log(email);
        const findUser =await User.findOne({email:email});
        if(findUser){
            console.log("find user",findUser)
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp);
            if(emailSent){
                req.session.userOtp = otp;
                req.session.email = email;
                console.log("Otp",otp)
               return res.render("passwordOtp");
              
            }else{
                res.json({success:false,message:"Faoled to send OTP. Plese try again"})
            }

        }else{
            console.log("hello redirect email")
            res.render("email",{
                message:"User with this emil does not exist"
            })
        }
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};


const verifyotp = async(req,res)=>{
    try {
        const {otp} = req.body;
        console.log(otp);
        console.log(req.session.userOtp);

        if(otp === req.session.userOtp){
            res.json({success:true,redirectUrl:"/reset-password"});
        }else{
            res.json({success:false,message:"OTP not matching"});
        }

    } catch (error) {
        res.status(500).json({success:false,message:"An error occured . Please try again"});
    }
};


const getResetPassPage = async(req,res)=>{
    try {
        const error = req.query.error||null;
        res.render("resentPassword",{error:error});
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

const resendForgotOtp = async(req,res)=>{
    try {
        const otp = generateOtp();
        req.session.userOtp = otp;
        const email = req.session.email;
        console.log("REsenting to email",email);
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("OTP",otp);
            res.status(200).json({success:true,message:"Resend OTP successfull"});
        }
    } catch (error) {
        console.error("renet otp ",error);
        res.status(500).json({success:true,message:"Internal Server Error"});
    }
};

const resetPassword = async(req,res)=>{
    try {
        const{ password,cpassword}= req.body;
        const email = req.session.email;
        if(password == cpassword){
            const passwordHash = await securePassword(password);
            console.log("update",password);
            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )
            res.redirect("/signup");
        }else{
            res.redirect("/resentPassword?error= Password do not match");
        }
    } catch (error) {
        res.redirect("/pageNotFound");
    }
}

const userProfile = async(req,res)=>{
    try {
        const userId = req.session.user._id;
        const userData = await User.findById(userId);
        const addressData = await Address.findOne({_id:userId})
        res.render("profile",{user:userData,userAddress:addressData});
    } catch (error) {
        console.error("user profile error",error);
        res.redirect("/pageNotFound");
    }
};


// const getChangeProfile = async(req,res)=>{
//     try {
//         res.render("changeProfile");
//     } catch (error) {
//         res.redirect("/pageNotFound");
//     }
// };

const updateProfile = async(req,res)=>{
    console.log("fine");
    try {
        const {name,phone,userId} = req.body;
        console.log(name)
        
        const findUser = await User.findByIdAndUpdate(
            {_id:userId},
            {$set:{username:name,phone:phone}}
        );
        if(findUser){
            return res.status(200).json({success:true,message:"Profile Updated successfully"})
        }else{
            return res.status(404).json({success:false,message:"User not found"});
        }

        // res.json({success:true,message:"update skuccessfully"});
    } catch (error) {
        console.error("profile update error",error.message);
        res.json({success:false,message:"Internal server error"});
    }
} ;

const getAddressPage =async(req,res)=>{
    try {
        const userId = req.session.user._id;
        const addressData = await Address.findOne({userId:userId})
        console.log(addressData);
        return res.render("displayaddresses",{userAddress:addressData})
    } catch (error) {
        console.log("get address page error",error.message);
    }
}


const addAddress = async(req,res)=>{
    try {
        const user = req.session.user.id;
        res.render("add-address",{user:user})
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

const postAddAddress = async(req,res)=>{
    try {
        console.log("ivide athi");
        const userId = req.session.user._id;
        const userData = await User.findOne({_id:userId});
        const {name,phone,addressType,city,state,landMark,pincode,altPhone} = req.body;
        console.log(name,phone,addressType,city,state,landMark,pincode,altPhone);
        const userAddress =await Address.findOne({userId:userData._id});
        if(!userAddress){
            const newAddress = new Address({
                userId:userData._id,
                address:[{addressType,name,city,landMark,state,pincode,phone,altPhone}]
            })
            await newAddress.save();
        }else{
            userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone});
            await userAddress.save();
        }
        return res.status(200).json({success:true,message:"Address added successfuly"})
    } catch (error) {
        console.log("post add address error",error);
        res.status(500).json({success:false,message:"Internal Server Error"})
    }
};

const editAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const user = req.session.user._id;
        const currAddress = await Address.findOne({
            "address._id":addressId
        });
        if(!currAddress){
            return res.redirect("/pageNotFound");
        }
        const addressData = currAddress.address.find((item)=>{
            return item._id.toString()=== addressId.toString();
        })
        if(!addressData){
            return res.redirect("/pageNotFound");
        }

        res.render("editAddress",{address:addressData,user:user,id:addressId})
    } catch (error) {
        console.log("edit page erorr",error.message);
        res.redirect("/pageNotFound")
    }
};


const postEditAddress = async (req, res) => {
    console.log("okke controllerl problem");
    try {
        const data = req.body;
        console.log("fetch data",data);
        const addressId = req.params.id;
        const userId = req.session.user._id;

        console.log(addressId,userId);

        const findAddress = await Address.findOne({ "address._id": addressId });
        if (!findAddress) {
            return res.status(404).json({ success: false, message: "Address not found" }); // Add return here
        }

        await Address.updateOne(
            { "address._id": addressId },
            {
                $set: {
                    "address.$": {
                        _id: addressId,
                        addressType: data.addressType,
                        name: data.name,
                        city: data.city,
                        landMark: data.landMark,
                        state: data.state,
                        pincode: data.pincode,
                        phone: data.phone,
                        altPhone: data.altPhone,
                    },
                },
            }
        );

        res.status(200).json({ success: true, message: "Update successfully" });
    } catch (error) {
        console.log("edit address error", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



const deleteAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const findAddress = await Address.findOne({"address._id":addressId});
        if(!findAddress){
            return res.status(404).send("Address not found")
        }

        await Address.updateOne({
            "address._id":addressId
        },
        {
            $pull:{
                address:{
                    _id:addressId,
                }
            }
        }
    );
     return res.redirect("/userAdresses");
    } catch (error) {
        console.log("delete address  error",error.message);
        res.redirect("/pageNotFound");
    }
}



module.exports ={
    getemail,
    Forgotemail,
    verifyotp,
    getResetPassPage,
    resendForgotOtp,
    resetPassword,
    userProfile,
    // getChangeProfile,
    updateProfile,
    addAddress,
    postAddAddress,
    getAddressPage,
    editAddress,
    postEditAddress,
    deleteAddress,
}