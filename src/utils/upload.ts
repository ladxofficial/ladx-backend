import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG, and PDF files are allowed!"));
        }
        cb(null, true);
    },
});

export default upload;
