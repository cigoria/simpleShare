/**
 * Helpers for handling file drag-and-drop (including folders) and clipboard paste.
 */

/**
 * Reads all entries from a DirectoryReader, looping until empty (handling browser batching).
 * @param {FileSystemDirectoryReader} directoryReader
 * @returns {Promise<FileSystemEntry[]>}
 */
async function readAllDirectoryEntries(directoryReader) {
  const entries = [];
  const readBatch = () => {
    return new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject);
    });
  };

  let batch;
  do {
    batch = await readBatch();
    for (const entry of batch) {
      entries.push(entry);
    }
  } while (batch.length > 0);

  return entries;
}

/**
 * Recursively traverses a FileSystemEntry and returns an array of File objects with relativePath.
 * @param {FileSystemEntry} entry
 * @param {string} currentPath
 * @returns {Promise<File[]>}
 */
async function traverseFileSystemEntry(entry, currentPath = "") {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      entry.file(
        (file) => {
          const relativePath = currentPath
            ? `${currentPath}/${file.name}`
            : file.name;
          const sanitizedPath = relativePath
            .replace(/\\/g, "/")
            .split("/")
            .filter((p) => p !== ".." && p !== ".")
            .join("/");

          Object.defineProperty(file, "relativePath", {
            value: sanitizedPath,
            writable: true,
            configurable: true,
          });
          resolve([file]);
        },
        (error) => {
          console.warn(`Failed to read file ${entry.name}:`, error);
          resolve([]);
        },
      );
    });
  } else if (entry.isDirectory) {
    try {
      const dirReader = entry.createReader();
      const entries = await readAllDirectoryEntries(dirReader);
      const nextPath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;

      const files = [];
      for (const childEntry of entries) {
        const childFiles = await traverseFileSystemEntry(childEntry, nextPath);
        files.push(...childFiles);
      }
      return files;
    } catch (error) {
      console.warn(`Failed to read directory ${entry.name}:`, error);
      return [];
    }
  }
  return [];
}

/**
 * Extracts all files from DataTransfer (drag & drop), recursively traversing directories.
 * @param {DataTransfer} dataTransfer
 * @returns {Promise<{ files: File[], folderName: string | null, isFolder: boolean }>}
 */
export async function extractFilesFromDataTransfer(dataTransfer) {
  if (!dataTransfer) {
    return { files: [], folderName: null, isFolder: false };
  }

  const items = dataTransfer.items;
  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === "function") {
    const rootEntries = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          rootEntries.push(entry);
        }
      }
    }

    if (rootEntries.length > 0) {
      const directoryEntries = rootEntries.filter((e) => e.isDirectory);
      const isFolder = directoryEntries.length > 0;
      let folderName = null;

      // If exactly one folder was dropped at the root
      if (directoryEntries.length === 1 && rootEntries.length === 1) {
        folderName = directoryEntries[0].name;
        // Collect files relative to the inside of this single folder
        const dirReader = directoryEntries[0].createReader();
        const entries = await readAllDirectoryEntries(dirReader);
        const files = [];
        for (const childEntry of entries) {
          const childFiles = await traverseFileSystemEntry(childEntry, "");
          files.push(...childFiles);
        }
        return { files, folderName, isFolder: true };
      }

      // If multiple items (or multiple folders) were dropped
      if (isFolder && directoryEntries.length > 0) {
        folderName = directoryEntries[0].name;
      }

      const files = [];
      for (const entry of rootEntries) {
        const entryFiles = await traverseFileSystemEntry(entry, "");
        files.push(...entryFiles);
      }

      return { files, folderName, isFolder };
    }
  }

  // Fallback to dataTransfer.files
  const filesList = dataTransfer.files ? Array.from(dataTransfer.files) : [];
  return {
    files: filesList,
    folderName: null,
    isFolder: false,
  };
}

/**
 * Extracts File objects from ClipboardData (paste event).
 * @param {DataTransfer} clipboardData
 * @returns {File[]}
 */
export function extractFilesFromClipboard(clipboardData) {
  if (!clipboardData) return [];

  const files = [];

  if (clipboardData.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          // Normalize file name if generic or missing
          let name = file.name;
          if (!name || name === "image.png") {
            const ext = file.type ? file.type.split("/")[1] || "png" : "png";
            const timestamp = new Date()
              .toISOString()
              .slice(0, 19)
              .replace(/[:T]/g, "-");
            name = `clipboard_${timestamp}.${ext}`;
            const namedFile = new File([file], name, {
              type: file.type || "image/png",
              lastModified: Date.now(),
            });
            files.push(namedFile);
          } else {
            files.push(file);
          }
        }
      }
    }
  }

  if (files.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      files.push(clipboardData.files[i]);
    }
  }

  return files;
}
