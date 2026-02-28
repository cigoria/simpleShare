import { isEmptyBindingElement, PollingWatchKind } from "typescript";
const pool = require("./db");
import * as auth from "./auth";
const bcrypt = require("bcrypt")
require("dotenv").config();

// Either returns 0:success and 1:already exists 2:other error
export async function registerUser(new_username:string,new_password:string,is_admin:boolean=false,quota:Number=52428800):Promise<Number>{
    try {
        let password_hash:string = await bcrypt.hash(new_password,10)
        let verification_result = await auth.checkUser(new_username)
        if (verification_result){return 1}
        await pool.query("INSERT INTO users (username, password_hash, is_admin, quota_in_bytes) VALUES (?, ?, ?, ?)",[new_username, password_hash, is_admin ? 1 : 0, quota]);
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}