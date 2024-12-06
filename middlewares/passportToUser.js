const passportToUser = (req,res,next)=>{
    if(req.session?.passport?.user){
        req.session.user = req.session.passport.user;
    }
    next()
}

module.exports = {passportToUser}