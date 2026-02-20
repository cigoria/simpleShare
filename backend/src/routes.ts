import { response } from 'express';
import { Request, Response } from 'express';
const express = require('express');
const path = require("path")
const router = express.Router();


// Base routes

router.get("/", (req: Request,res:Response) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
})


// Admin action API endpoints



// User action API endpoints



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