const passport = require("passport");
const googleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const env = require("dotenv").config();


passport.use(new googleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,//process.env.GOOGLE_CLIENT_ID
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,//GOOGLE_CLIENT_SECRET
    callbackURL: "http://localhost:3000/auth/google/callback"
},

async(accessToken,refereshToken,profile,done)=>{
    try {
       let user = await User.findOne({googleId:profile.id});
       if(user){
        return done(null,user);
       }else{
        user =new User({
            username:profile.displayName,
            email:profile.emails[0].value,
            googleId:profile.id,
        });
        await user.save();
        return done(null,user);
       }
    } catch (error) {
        console.log(error.massage);
        return done(error,null);
        
    }
}

));

// store session user ID
passport.serializeUser((user,done)=>{
    done(null,user);
});

// session nill nin user data fuch cheyith edukkanan
passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user)
    
    
    })
    .catch(err=>{
        done(err,null)
    });
});


module.exports = passport;