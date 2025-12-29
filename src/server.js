const express = require("express");
const path = require("path");
const os = require("os");
require('dotenv').config();
const mariadb = require("mariadb");
const bcrypt = require('bcrypt');

console.log(process.env.DB_HOST);
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "simpleShare",
    connectionLimit: 5
});
const app = express();
app.use(express.static(path.join(__dirname, "./static")));



async function createRandomString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function verifyCredentials(username, password) {
    if (username == process.env.MASTER_USER && password == process.env.MASTER_PASSWORD) {return {"valid":false,"user_id":"master"};}
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
        let password_hash = await bcrypt.hash(password, 10);
        if (rows.length > 0) {
            bcrypt.compare(password, rows[0].password_hash, function(err, result) {
                if (result == true) {return {"valid":true,"user_id":rows[0].id};}
                else {return {"valid":false,"user_id":rows[0].id};}
            });
        }
        else {return {"valid":false,"user_id":null};}
    } finally {if (conn) conn.release();}
}

async function getPermissions(token)  {
    let conn;
    try {
        conn = await pool.getConnection();
        let res1 = conn.query("SELECT * FROM session_tokens WHERE token = ?", [token]);
        if (res1.length > 0) {
            let res2 = conn.query("SELECT * FROM users WHERE id = ?", [res1.user_id]);
            if (res2.length > 0) {
                if (res2[0].is_admin == 1) {return "admin"}
                else {return "user"}
            }
            else{return "none";}
        }
        else {return "none"}
    }
    finally {if (conn) conn.release();}
}

async function generateSession(user_id) {
    let conn;
    try {
        conn = await pool.getConnection();
        let token = await createRandomString(200)
        await conn.query("INSERT INTO session_tokens value (?, ?)", [user_id, token]);
        return token
    } finally {if (conn) {conn.release()};}
}

async function registerUser(username,password) {
    let conn;
    try {
        conn = await pool.getConnection();
        let password_hash = await bcrypt.hash(password, 10);
        let verified = await verifyCredentials(username, password);
        if (verified.user_id === null) {
            await conn.query("INSERT INTO users (username,password_hash) VALUES (?, ?)", [username, password_hash]);
            return {"success":true,"error":null}
        }
        else {return {"success":false,"error":"User already exists!"}};
    }
    finally {if (conn) {conn.release()};}
}

app.get("/login", async (req, res) => {
    res.sendFile(path.join(__dirname, "./static/login.html"));
})
app.post("/login", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
        res.status(400).json({status: 400,error: "Username and password is required for autentication!"});
    }

    let verification_result = await verifyCredentials(username, password);
    if (verification_result.valid == true) {
        let token = await generateSession(verification_result.user_id);
        res.status(200).json({status:200, error:null ,token: token});
    }
    else{
        res.status(401).json({status: 401,error: "Invalid Credentials!"});
    }
})

app.post("/register", async (req, res) => {
    let new_username = req.body.username;
    let new_password = req.body.password;
    let auth_token = req.body.token;
    if (!new_username || !new_password || !auth_token) {
        res.status(400).json({status: 400,error: "Invalid request!"});
    };
    let request_maker_permission = await getPermissions(auth_token);
    if (request_maker_permission == "admin") {
        let result = await registerUser(new_username, new_password);
        if (result.success == true) {
            res.status(200).json({status:200, error:null});
        }
        else {
            res.status(400).json({status:400, error:"User already exists!"});
        }
    }
    else {
        res.status(401).json({status: 401,error: "Invalid Credentials!"});
    }
})

app.use("/", (req, res, next) => {
    res.sendFile(path.join(__dirname, "./static/index.html"));
});

function getIPv4Addresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === "IPv4" && !interface.internal) {
                addresses.push(interface.address);
            }
        }
    }
    return addresses;
}

app.listen(3000, () => {
    console.log("Server is Running");
    console.log(`http://localhost:${process.env.PORT || 3000}`);

    const ipAddresses = getIPv4Addresses();
    ipAddresses.forEach((ip) => {
        console.log();
        console.log(`http://${ip}:${process.env.PORT || 3000}`);
    });
});