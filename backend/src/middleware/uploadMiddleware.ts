import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const uploadPath = path.join(
  process.cwd(),
  "uploads"
);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// Storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath);
  },

  filename(req, file, cb) {
    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

// Allowed file types
const allowedExtensions = [
  ".csv",
  ".xls",
  ".xlsx",
];

function fileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only CSV, XLS and XLSX files are allowed."
      )
    );
  }
}

export const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      25 * 1024 * 1024,
  },
});


