import { isEmptyBindingElement, PollingWatchKind } from "typescript";

const mariadb = require("mariadb");
const bcrypt = require("bcrypt");
require("dotenv").config();


const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "simpleShare",
  connectionLimit: 5,
  charset: "utf8mb4",
});

export type PermissionLevel = "admin" | "user" | "none"
export interface PermissionResponse {
    user_id: string | null;
    level: PermissionLevel;
    met: boolean;
}
export interface LoginResponse {
    token: string | null;
    success: boolean;
    message: string;
}


export async function validateUserToken(token:string, validateTo:PermissionLevel | null): Promise<PermissionResponse> {
    let conn;
    try {

        conn = await pool.getConnection();
        // Query tokens table
        const token_result = await conn.query("SELECT * FROM session_tokens WHERE token = ?",[token])

        // Checks before querying for user data
        if (token_result.length === 0){
            return {user_id: null,level:"none",met:false}
        }
        let user_id:string = token_result[0]["user_id"];

        if (token_result[0]["is_valid"] === false) {
            return {user_id: user_id,level:"none",met:false}
        }
        
        // Query users table
        const user_result = await conn.query("SELECT * FROM users WHERE id=?",[user_id])
        
        if (user_result.length === 0){
            return {user_id: null,level:"none",met:false}
        }

        let permission:PermissionLevel = "none"
        switch(user_result[0].is_admin){
            case(true):{permission = "admin"};
            case(false):{permission = "user";}
        }
        
        if (validateTo === null) {
            return {user_id:user_id, level:permission,met:false}
        } else {
            return {user_id:user_id, level:permission,met:validateTo===permission}
        }
    } finally{
        if (conn) {conn.release()}
    }
}

export async function generateSession(user_id:string,user_agent:string | null): Promise<string | null>{
    let conn;
    try {
        const chars:string =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let token:string = "";
        for (let i:number = 0; i < chars.length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));}
        conn = await pool.getConnection();
        let agent_text:string = ""
        if (user_agent !== null){agent_text=user_agent} 
        let result = await conn.query("INSERT INTO session_tokens (token, user_id, user_agent) value (?, ?, ?)",[token, user_id, agent_text]);
        return token;
    } catch{
        return null;
    } finally {if (conn) {conn.release();}}
    
}


export async function loginUser(username:string,password:string,user_agent:string | null): Promise<LoginResponse> {
    let conn;
    try{
        conn = await pool.getConnection();
        const user_result = await conn.query("SELECT * FROM users WHERE username = ?",[username])
        if (user_result.length === 0){return {token:null,success:false,message:"User does not exist!"}}
        const isMatch = await bcrypt.compare(password, user_result[0].password_hash);
        if (isMatch){
            let new_token: string | null = await generateSession(user_result[0].id,user_agent)
            if (new_token === null) {return {token:null,success:false,message:"Failed to generate token!"}}
            else {return {token:new_token, success:true,message:"Success"}}
        } else{
            return {token:null,success:false,message:"Invalid credentials!"}
        }
    }
    catch{
        return {token:null,success:false,message:"Server error!"}
    }
    finally{
        if (conn){ conn.release();}
    }

}

export async function logoutUser(token:string){
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("DELETE FROM session_tokens WHERE token = ?",[token]);
        return true;
    } catch{
        return false;
    }finally{if (conn){conn.release()}}
}

export async function checkUser(username:string) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT * FROM users WHERE username = ?",[username]);
        return result.length !== 0;
    } finally {if (conn){conn.release()}}
}

export async function registerUser(username:string,password:string,is_admin:boolean = false,quota:number=52428800){
    let conn;
    try {
        conn = await pool.getConnection();
        let password_hash:string = await bcrypt.hash(password, 10);
        let exists: boolean = await checkUser(username)
        if (exists) {return false}
        else {
            await conn.query("INSERT INTO users (username, password_hash, is_admin, quota_in_bytes) VALUES (?, ?, ?, ?)",[username, password_hash, is_admin ? 1 : 0, quota],);
        }
    } catch{
        return false;
    }finally {if (conn) {conn.release()}}
}