import { isEmptyBindingElement, PollingWatchKind } from "typescript";
import { Request, Response, NextFunction } from 'express';
import { FileFilterCallback } from "multer";
const mariadb = require("mariadb");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path")
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
export interface File {
  code:string;
  visibility:Number;
  upload_date:string;
  size:Number;
  stored_name:string;
  original_name:string;
  mimetype:string;
  user_id:string;
  type:"file";
}

export interface FileGroup {
  code:string;
  name:string;
  file_ids:(string)[];
  files:(File)[];
  create_date:string;
  type:"group";
}

export async function getTotalQuota(user_id:string | null): Promise<Number> {
  let conn;
  try {
    if (user_id === null) {return 1}
    conn = await pool.getConnection();
    let user_result = await conn.query("SELECT * FROM users WHERE id = ?", [user_id]);
    return user_result[0].quota_in_bytes;
  } finally {if (conn) {conn.release();}}
}

export async function getUsedQuota(user_id:string | null): Promise<Number> {
  let conn;
  try {
    if (user_id === null) {return 1}
    conn = await pool.getConnection();
    let used_res = await conn.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",[user_id]);
    return used_res[0].total_used;
  } finally {if (conn) {conn.release();}}
}

export async function getAllFiles(user_id:string | null){
  let conn;
  try {
    conn = await pool.getConnection();
    let file_results = await conn.query("SELECT * FROM file_index WHERE user_id=?",[user_id])
    let group_results = await conn.query("SELECT * FROM file_groups WHERE user_id = ?",[user_id])
    // Create a hashmap based on file codes
    let file_hashmap:Record<string,File> = {}
    for (let file of file_results) {
      let file_code:string = file.id;
      file_hashmap[file_code] = {
        code:file.id,
        visibility:file.visibility,
        upload_date:file.date_added,
        size:file.file_size_in_bytes,
        stored_name:file.stored_filename,
        original_name:file.original_name,
        mimetype:file.mime_type,
        user_id:file.user_id,
        type:"file"
      };
    }
    let grouped_list:(string)[] = []
    let return_list:(File | FileGroup)[] = []
    for (let group of group_results) {
      let temp_dict:FileGroup = {
        code:group.id,
        name:group.name,
        file_ids:group.file_ids,
        files:[],
        create_date: group.created_at,
        type:"group"
      }
      for (let file_id of group.file_ids) {
        temp_dict.files.push(file_hashmap[file_id])
        grouped_list.push(file_id)
      }
      return_list.push(temp_dict)
    }
    let res = Object.keys(file_hashmap).filter((e) => !grouped_list.includes(e));
    for (let id of res){
      return_list.push(file_hashmap[id])
    }
    return_list.push()
    return return_list
  } finally {if(conn){conn.release()}} 
}

export async function changePassword(user_id:string | null,cur_password:string,new_password:string):Promise<Number>{
  let conn;
  try{
    conn = await pool.getConnection();
    let user_result = await conn.query("SELECT * FROM users WHERE id=?",[user_id])
    if (user_result.length === 0){return 3} // Invalid user_id
    const is_match_toold:boolean = await bcrypt.compare(cur_password,user_result[0].password_hash)
    const is_match_tonew:boolean = await bcrypt.compare(new_password,user_result[0].password_hash)
    if (!is_match_toold) {return 2} // Invalid current password
    if (is_match_tonew){return 1} // Error New password cannot be the same as the old
    let new_password_hash:string = await bcrypt.hash(new_password, 10);
    await conn.query("UPDATE users SET password_hash =? WHERE id = ?",[new_password_hash, user_id]); // Update password hash in database
    await conn.query("DELETE FROM session_tokens WHERE user_id = ?",[user_id]); // Delete all active sessions
    return 0 // Success
  } catch(err){
    console.log(err);
    return 4 // Server faliure ???
  } finally{if(conn){conn.release()}}
}

// UPLOAD SECTION


async function getTotalStorageUsed():Promise<number> {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index",);
    return Number(result[0].total_used || 0);
  } finally {if (conn) conn.release();}
}

async function getGlobalStorageLimit():Promise<number> {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("SELECT num_value FROM settings WHERE name = ?",["global-storage-limit"]);
    return result.length > 0 ? Number(BigInt(result[0].num_value)) : 0;
  } finally {if (conn) conn.release();}
}

async function calculateRemainingGlobalStorage() {
  const totalLimit:number = await getGlobalStorageLimit();
  if (totalLimit === 0) return null; // Unlimited
  const totalUsed:number = await getTotalStorageUsed();
  return totalLimit - totalUsed;
}

async function calculateRemainFromQuota(user_id:string):Promise<number | null> {
  let conn;
  try {
    conn = await pool.getConnection();
    let result = await conn.query("SELECT quota_in_bytes FROM users WHERE id = ?",[user_id]);
    if (result.length === 0) return 0;
    let quota:number = Number(result[0].quota_in_bytes);
    if (quota == 0) return null;
    let used_res = await conn.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",[user_id]);
    let used_up:number = Number(used_res[0].total_used || 0)
    let remaining:number = quota - used_up
    return remaining;
  } finally {if (conn) conn.release();}
}

export async function registerUploadInIndex(req:Request& Record<string, any>) {
  let conn;
  try {
    conn = await pool.getConnection();
    if (!req.file) throw new Error("No file uploaded");
    
    // Rename the file to use the file code
    const ext = path.extname(req.file.originalname);
    const newFilename = `${req.fileCode}${ext}`;
    
    // Rename the file on disk
    const fs = require('fs');
    const oldPath = path.join(process.env.UPLOAD_PATH || './uploads', req.file.filename);
    const newPath = path.join(process.env.UPLOAD_PATH || './uploads', newFilename);
    
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
    
    let res = await conn.query(
      "INSERT INTO file_index(id, mime_type, stored_filename, original_name, file_size_in_bytes, user_id) VALUES (?,?,?,?,?,?)",
      [
        req.fileCode,
        req.file.mimetype,
        newFilename,
        req.file.originalname,
        req.file.size,
        req.user.id,
      ],
    );
    return !!res;
  } finally {if (conn) conn.release();}
}

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_PATH || "./uploads",
  filename: function (req:Request& Record<string, any>, file:Express.Multer.File, cb: (error: Error | null, filename: string)=>void){
    const ext = path.extname(file.originalname);
    // For single file upload, use a temporary name first, will be renamed later
    const filename = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${ext}`;
    cb(null, filename);
  },
});

export const uploadMiddleware = (req:Request& Record<string, any>, res:Response, next:NextFunction) => {
  const limits = {} as { [key: string]: any };
  if (req.maxUploadSize) {limits.fileSize = req.maxUploadSize;}

  const upload = multer({
    storage: storage,
    limits: limits,
  }).single("file");

  upload(req, res, (err:Error) => {
    if (err) return next(err);
    next();
  });
};

async function generateUniqueFileID(code_length:number) {
  let conn;
  try {
    conn = await pool.getConnection();
    const chars:string = "abcdefghijklmnopqrstuvwxyz";
    while (true) {
      let result:string = "";
      for (let i = 0; i < code_length; i++) {result += chars.charAt(Math.floor(Math.random() * chars.length));}
      let res = await conn.query("SELECT * FROM file_index WHERE id = ?", [result]);
      if (res.length == 0) {return result}
    }
  } finally {if (conn) {conn.release();}}
}

export const uploadGroupMiddleware = (req:Request& Record<string, any>, res:Response, next:NextFunction) => {
  const limits = {} as { [key: string]: any };
  if (req.maxUploadSize) {limits.fileSize = req.maxUploadSize;}

  const upload = multer({
    storage: storage,
    limits: limits,
  }).array("files");

  upload(req, res, (err:Error) => {
    if (err) return next(err);
    next();
  });
};

async function generateUniqueGroupID(code_length:number) {
  let conn;
  try {
    conn = await pool.getConnection();
    const chars:string = "abcdefghijklmnopqrstuvwxyz";
    while (true) {
      let result:string = "";
      for (let i = 0; i < code_length; i++) {result += chars.charAt(Math.floor(Math.random() * chars.length));}
      let res = await conn.query("SELECT * FROM file_groups WHERE id = ?", [result]);
      if (res.length == 0) {return result}
    }
  } finally {if (conn) {conn.release();}}
}

export async function prepareGroupUploadContext(req:Request& Record<string, any>, res:Response, next:NextFunction) {
  const groupCode = await generateUniqueGroupID(6);
  req.groupCode = groupCode;

  // Check global storage limit first
  const globalRemaining = await calculateRemainingGlobalStorage();
  if (globalRemaining !== null && globalRemaining <= 0) {return res.status(500).json({ error: "Global storage limit reached" });}

  // Check user quota
  let remaining = await calculateRemainFromQuota(req.user.id)
  
  if (remaining !== null) {
    if (remaining < BigInt(0)) {return res.sendStatus(413);}
    req.maxUploadSize = remaining;
  } 
  else if (globalRemaining !== null && remaining === null) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  // Apply global storage limit to max upload size if it's more restrictive
  if (globalRemaining !== null && remaining !== null && remaining > globalRemaining) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  next();
}

export async function registerGroupUploadInIndex(req:Request& Record<string, any>) {
  let conn;
  try {
    conn = await pool.getConnection();
    if (!req.files || req.files.length === 0) throw new Error("No files uploaded");
    
    const groupName = req.body.groupName || 'Untitled Group';
    const fileIds: string[] = [];
    const uploadedFiles: any[] = [];

    // First, register all files in the file_index table
    for (const file of req.files as Express.Multer.File[]) {
      const fileCode = await generateUniqueFileID(6);
      fileIds.push(fileCode);
      
      // Update the filename to include the file code
      const ext = path.extname(file.originalname);
      const newFilename = `${fileCode}${ext}`;
      
      // Rename the file on disk
      const fs = require('fs');
      const oldPath = path.join(process.env.UPLOAD_PATH || './uploads', file.filename);
      const newPath = path.join(process.env.UPLOAD_PATH || './uploads', newFilename);
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
      
      // Register file in database
      await conn.query(
        "INSERT INTO file_index(id, mime_type, stored_filename, original_name, file_size_in_bytes, user_id) VALUES (?,?,?,?,?,?)",
        [
          fileCode,
          file.mimetype,
          newFilename,
          file.originalname,
          file.size,
          req.user.id,
        ],
      );

      uploadedFiles.push({
        code: fileCode,
        originalname: file.originalname,
        size: file.size
      });
    }

    // Then create the group entry
    await conn.query(
      "INSERT INTO file_groups(id, name, file_ids, user_id, created_at) VALUES (?,?,?,?,?)",
      [
        req.groupCode,
        groupName,
        JSON.stringify(fileIds),
        req.user.id,
        new Date().toISOString(),
      ],
    );

    return {
      group: {
        id: req.groupCode,
        name: groupName
      },
      files: uploadedFiles
    };
  } finally {if (conn) conn.release();}
}

export async function prepareUploadContext(req:Request& Record<string, any>, res:Response, next:NextFunction) {
  const code = await generateUniqueFileID(6);
  req.fileCode = code;

  // Check global storage limit first
  const globalRemaining = await calculateRemainingGlobalStorage();
  if (globalRemaining !== null && globalRemaining <= 0) {return res.status(500).json({ error: "Global storage limit reached" });}

  // Check user quota
  let remaining = await calculateRemainFromQuota(req.user.id)
  
  if (remaining !== null) {
    if (remaining < BigInt(0)) {return res.sendStatus(413);}
    req.maxUploadSize = remaining;
  } 
  else if (globalRemaining !== null && remaining === null) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  // Apply global storage limit to max upload size if it's more restrictive
  if (globalRemaining !== null && remaining !== null && remaining > globalRemaining) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  next();
}
