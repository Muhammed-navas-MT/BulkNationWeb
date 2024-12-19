const Wallet = require("../../models/walletSchema");


const getWallet = async(req,res)=>{
    console.log("working find wallet");
    try {
        const userId = req.session.user._id;
        if(!userId){
            return res.redirect("/signup")
        }
        const findWallet = await Wallet.findOne({userId:userId});

        if(!findWallet){
            return res.render("wallet",{wallet:[]})
        }

        return res.render("wallet",{wallet:findWallet});
    } catch (error) {
        console.log("error in get wallet ",error.message)
        res.redirect("/")
    }
}


module.exports ={
    getWallet,
}