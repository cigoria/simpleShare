import { response } from 'express';
import { Request, Response } from 'express';
const express = require('express');
const path = require("path")
const router = express.Router();
import * as auth from "./auth";



// Base routes

router.get("/", (req: Request,res:Response) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
})


// Admin action API endpoints



// User action API endpoints

router.post("/login",async (req:Request,res:Response)=>{
  let username:string = req.body.username;
  let password:string = req.body.password;

  if (!username || !password){
    return res.status(400).json({
      status: 400,
      error: "Username and password is required for autentication!",
    });
  }

  let login_result = await auth.loginUser(username=username,password=password,req.headers['user-agent'] || null)
  if (login_result.success){
    return res.status(200).json({ status: 200, error: login_result.message, token: login_result.token });
  }
  else{
    return res.status(400).json({ status: 400, error: login_result.message, token: null });
  }
})

// Serve Vue app for all non-API routes

// router.get('*', (req:Request, res:Response) => {
//   // Don't intercept API routes or static files
//   if (req.path.startsWith('/api') || 
//       req.path.startsWith('/files') || 
//       req.path.startsWith('/admin') ||
//       req.path.includes('.')) {
//     return next();
//   }
  
//   res.sendFile(path.join(__dirname, './public/index.html'));
// });


export default router;