import express from "express";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";


const app = express();
const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json()) //req.body

app.use("/api/auth", authRoutes);

//make ready for deployment
if(ENV.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "../client/dist")))

    app.get("*",(_,res)=>{
        res.sendFile(path.join(__dirname, "../client", "dist", "index.html"));
    });
}


app.listen(PORT, ()=>{
    console.log("server running on port:"+ PORT);
    connectDB();
});