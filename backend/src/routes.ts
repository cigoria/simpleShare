import { Request, Response } from 'express';
import express from 'express';
const router = express.Router();
import * as auth from "./auth";
import * as uploadActions from "./uploadActions";

// Import controllers
import * as baseController from "./controllers/baseController";
import * as adminController from "./controllers/adminController";
import * as userController from "./controllers/userController";
import * as fileController from "./controllers/fileController";
import * as updateStatusController from "./controllers/updateStatus";
import * as linkController from "./controllers/linkController";

// Base routes
router.get("/", baseController.serveIndex);
router.get("/admin", baseController.serveAdmin);

// Admin action API endpoints
router.post('/register', adminController.registerUser);
router.post('/admin/user/changePassword', adminController.changeUserPassword);
router.post('/admin/user/changeUsername', adminController.changeUsername);
router.post('/admin/user/changeQuota', adminController.changeUserQuota);
router.post('/admin/user/changeAdminStatus', adminController.changeUserAdminStatus);
router.post('/admin/user/delete', adminController.deleteUser);
router.get("/admin/getGlobalLimit", adminController.getGlobalLimit);
router.get("/admin/getGlobalStorage", adminController.getGlobalStorage);
router.get("/admin/getStorageSettings", adminController.getStorageSettings);
router.get("/admin/getAllUsersWithFiles", adminController.getAllUsersWithFiles);
router.get("/admin/getAllFiles", adminController.getAllFiles);
router.get("/admin/getGroupDetails/:groupCode", adminController.getGroupDetails);
router.get("/admin/getUserStatistics", adminController.getUserStatistics);
router.get("/admin/getFileTypeStatistics", adminController.getFileTypeStatistics);
router.get("/admin/getSystemHealthMetrics", adminController.getSystemHealthMetrics);
router.delete("/admin/deleteFile/:fileCode", adminController.deleteFile);
router.post("/admin/updateStorageLimit", adminController.updateStorageLimit);

// File management endpoints
router.post("/admin/file/updateId", adminController.updateFileId);
router.post("/admin/file/updateName", adminController.updateFileName);

// Group management endpoints
router.post("/admin/group/updateId", adminController.updateGroupId);
router.post("/admin/group/updateName", adminController.updateGroupName);

// Link management endpoints
router.post("/admin/link/updateId", adminController.updateLinkId);
router.post("/admin/link/updateUrl", adminController.updateLinkUrl);

// User action API endpoints
router.post("/login", userController.login);
router.get("/logout", userController.logout);
router.get("/verifySession", userController.verifySession);
router.get("/quota", userController.getQuota);
router.get("/getAllFiles", userController.getAllUserFiles);
router.post("/changePassword", userController.changePassword);

// File upload and management endpoints
router.post("/upload", auth.authenticateUser, uploadActions.prepareUploadContext, uploadActions.uploadMiddleware, fileController.uploadFile);
router.post("/upload-group", auth.authenticateUser, uploadActions.prepareGroupUploadContext, uploadActions.uploadGroupMiddleware, fileController.uploadGroup);
router.post("/upload-multiple-individual", auth.authenticateUser, uploadActions.prepareGroupUploadContext, uploadActions.uploadGroupMiddleware, fileController.uploadMultipleIndividual);
router.get("/delete/:code", fileController.deleteItem);
router.get("/delete-groups/:code", fileController.deleteGroups);
router.get("/files/:file_code", fileController.getFile);
router.post("/checkFile", fileController.checkFile);
router.post("/create-group-from-files", auth.authenticateUser, fileController.createGroupFromFiles);

// Update status endpoints
router.get("/api/update-status", updateStatusController.getUpdateStatus);
router.post("/api/update-status", updateStatusController.setUpdatingStatus);

// Link sharing endpoints
router.post("/share-link", auth.authenticateUser, linkController.createSharedLink);
router.get("/share-link", auth.authenticateUser, linkController.getUserSharedLinks);
router.delete("/share-link/:id", auth.authenticateUser, linkController.deleteSharedLink);
router.get("/admin/all-links", auth.authenticateUser, linkController.getAllSharedLinks);
router.get("/:id", linkController.getSharedLink);

export default router;