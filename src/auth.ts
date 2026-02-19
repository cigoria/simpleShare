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

type PermissionLevel = "admin" | "user" | "none"
interface PermissionResponse {
    user_id: string | null;
    level: PermissionLevel;
    met: boolean;
}


async function validateUserToken(token:string, validateTo:PermissionLevel | null): Promise<PermissionResponse> {
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

async function generateSession(user_id:string): Promise<string | null>{
    let conn;
    try {
        const chars:string =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let token:string = "";
        for (let i:number = 0; i < chars.length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));}
        conn = await pool.getConnection();
        await conn.query("INSERT INTO session_tokens (token, user_id) value (?, ?)",[token, user_id]);
        return token;
    } catch{
        return null;
    } finally {if (conn) {conn.release();}}
    
}

interface LoginResponse {
    token: string | null;
    success: boolean;
    message: string;
}

async function loginUser(username:string,password:string): Promise<LoginResponse> {
    let conn;
    try{
        conn = pool.getConnection();
        const user_result = conn.query("SELECT * FROM users WHERE username = ?",[username])
        if (user_result.length === 0){return {token:null,success:false,message:"User does not exist!"}}
        const isMatch = await bcrypt.compare(password, user_result[0].password_hash);
        if (isMatch){
            let new_token: string | null = await generateSession(user_result[0].id)
            if (new_token === null) {return {token:null,success:false,message:"Failed to generate token!"}}
            else {return {token:new_token, success:true,message:"Success"}}
        } else{
            return {token:null,success:false,message:"Invalid credentials!"}
        }
    }
    finally{
        if (conn){ conn.release();}
    }
}

async function logoutUser(token:string){
    
}