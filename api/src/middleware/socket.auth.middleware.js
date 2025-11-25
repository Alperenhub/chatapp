import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const socketAuthMiddleware = async (socket, next) => {

    try {
        const token = socket.handshake.headers.cookie
        ?.split(";")
        .find((row)=> row.startsWith("jwt="))
        ?.split("=")[1];

        if(!token){
            console.log("Socket bağlanmayı reddetti.");
            return next(new Error("Token bulunamadı."));
        }

        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if(!decoded){
            console.log("Soket bağlanamadı");
            return next(new Error("Token bulunamadı."));
        }

        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
             console.log("Soket bağlanamadı");
            return next(new Error("Kullanıcı bulunamadı."));
        }

        socket.user = user;
        socket.userId = user._id.toString();

        next();

    } catch (error) {
        console.log("soket bağlanma hatası: ", error.message);
    return next(new Error("Token bulunamadı."));

    }
};