import { Request, Response } from 'express';
import path from "path";
import { existsSync } from 'fs';

export const serveIndex = (req: Request, res: Response) => {
  const devPath = path.join(__dirname, '../../client/index.html');
  const prodPath = path.join(__dirname, '../public/index.html');
  const useDev = process.env.NODE_ENV === 'development' && existsSync(devPath);
  const indexPath = useDev ? devPath : prodPath;
  return res.sendFile(indexPath);
};

export const serveAdmin = (req: Request, res: Response) => {
  return serveIndex(req, res);
};
