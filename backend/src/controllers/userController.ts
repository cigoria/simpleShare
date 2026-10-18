import { Request, Response } from 'express';
import * as auth from "../auth";
import * as userActions from "../userActions";

const { extractToken } = auth;

export const login = async (req: Request, res: Response) => {
  let username: string = req.body.username;
  let password: string = req.body.password;
  if (!username || !password) {
    return res.status(400).json({
      status: 400,
      error: "Username and password is required for autentication!",
    });
  }
  let login_result = await auth.loginUser(username = username, password = password, req.headers['user-agent'] || null)
  if (login_result.success) {
    res.cookie("session_token", login_result.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 90
    });
    return res.status(200).json({ status: 200, error: login_result.message, token: login_result.token });
  }
  else { return res.status(400).json({ status: 400, error: login_result.message, token: null }); }
};

export const logout = async (req: Request, res: Response) => {
  const token = extractToken(req);
  res.clearCookie("session_token");
  if (!token) { return res.status(400) }
  let logout_result = await auth.logoutUser(token);
  if (logout_result) { return res.sendStatus(200) }
  else { return res.sendStatus(500) }
};

export const verifySession = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) { return res.status(401) }
  let user_permission = await auth.validateUserToken(token, null);
  if (user_permission.level !== "none") {
    res.cookie("session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 90
    });
    return res.status(200).json({ permission: user_permission.level });
  }
  else { return res.status(401).json({ permission: user_permission.level }) }
};

export const getQuota = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) return res.sendStatus(401);
  let user_permission = await auth.validateUserToken(token, null)
  if (user_permission.level === "none") { return res.sendStatus(401) }
  let total_quota = await userActions.getTotalQuota(user_permission.user_id)
  let used_quota = await userActions.getUsedQuota(user_permission.user_id)
  let used_quota_value = used_quota && used_quota ? used_quota : 0;
  let total_quota_value = total_quota ? total_quota : 0;
  return res.status(200).json({
    total: Number(total_quota_value),
    used: Number(used_quota_value),
  });
};

export const getAllUserFiles = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) { return res.sendStatus(401) }
  let user_permission = await auth.validateUserToken(token, null)
  if (user_permission.level === "none") { return res.sendStatus(401) }
  let files = await userActions.getAllFiles(user_permission.user_id)
  return res.status(200).json(files)
};

export const changePassword = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) { return res.sendStatus(401) }
  if (!req.body.old_password || !req.body.new_password) { return res.sendStatus(400) }
  let user_permission = await auth.validateUserToken(token, null);
  if (user_permission.level === "none") { return res.sendStatus(401) }
  let action_result = await userActions.changePassword(user_permission.user_id, req.body.old_password, req.body.new_password)

  switch (action_result) {
    case (0): res.sendStatus(200); break;
    case (1): res.status(400).json({ message: "New password cannot be the same as old password!" }); break;
    case (2): res.sendStatus(401); break;
    case (3): res.sendStatus(500); console.log("Invalid user_id?!?!?!?"); break;
    case (4): res.sendStatus(500); break;
  }
};
