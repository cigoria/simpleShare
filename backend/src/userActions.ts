import { isEmptyBindingElement, PollingWatchKind } from "typescript";
import { Request, Response, NextFunction } from 'express';
import { FileFilterCallback } from "multer";
const bcrypt = require("bcrypt");
const pool = require("./db");
require("dotenv").config();

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
  try {
    if (user_id === null) {return 1}
    let user_result = await pool.query("SELECT * FROM users WHERE id = ?", [user_id]);
    return user_result[0].quota_in_bytes;
  } catch(err){console.log(err);return 1}
}

export async function getUsedQuota(user_id:string | null): Promise<Number> {
  try {
    if (user_id === null) {return 1}
    let used_res = await pool.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",[user_id]);
    return used_res[0].total_used;
  } catch(err){console.log(err); return 1}
}

export async function getAllFiles(user_id:string | null){
  try {
    let file_results = await pool.query("SELECT * FROM file_index WHERE user_id=?",[user_id])
    let group_results = await pool.query("SELECT * FROM file_groups WHERE user_id = ?",[user_id])
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
  } catch(err){console.log(err)}
}

export async function changePassword(user_id:string | null,cur_password:string,new_password:string):Promise<Number>{
  try{
    let user_result = await pool.query("SELECT * FROM users WHERE id=?",[user_id])
    if (user_result.length === 0){return 3} // Invalid user_id
    const is_match_toold:boolean = await bcrypt.compare(cur_password,user_result[0].password_hash)
    const is_match_tonew:boolean = await bcrypt.compare(new_password,user_result[0].password_hash)
    if (!is_match_toold) {return 2} // Invalid current password
    if (is_match_tonew){return 1} // Error New password cannot be the same as the old
    let new_password_hash:string = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash =? WHERE id = ?",[new_password_hash, user_id]); // Update password hash in database
    await pool.query("DELETE FROM session_tokens WHERE user_id = ?",[user_id]); // Delete all active sessions
    return 0 // Success
  } catch(err){
    console.log(err);
    return 4 // Server faliure ???
  }
}

