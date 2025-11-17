import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";

export const signup = async (req,res)=>{
    const {fullName, email, password} = req.body

try {
    if(!fullName || !email || !password){
        return res.status(400).json({message:"Lütfen tüm alanları doldurunuz."})
    }

    if(password.length <6){
        return res.status(400).json({message:"Şifreniz minimum 6 karakter olmalıdır."})
    }

    //check email valids: regex (regular expression)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        return res.status(400).json({message: "Emailinizi doğru yazınız."});
    }

    const user = await User.findOne({email:email});
    if(user) return res.status(400).json({message:"Bu email zaten kayıtlı"});

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword
    })

    if(newUser){
        // generateToken(newUser._id, res)
        // await newUser.save();

        const savedUser = await newUser.save();
        generateToken(savedUser._id, res);
        res.status(201).json({
            _id:newUser._id,
            fullName:newUser.fullName,
            email:newUser.email,
            profilePic:newUser.profilePic
        });

        try {
            await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
        } catch (error) {
            console.error("Failed to send welcome email:", error);
        }

    }else{
        res.status(400).json({message:"Kullanıcı verisi hatası"})
    }
    
} catch (error) {
    console.log("Signup controller'ında hata:", error)
    res.status(500).json({message:"Internal server error"});   
}
};