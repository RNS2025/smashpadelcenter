const express = require("express");
const newsService = require("../Services/newsService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logger = require("../config/logger"); // Import logger

// Ensure the 'uploads/images' directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info("Created uploads directory", { path: uploadDir });
}

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Folder where images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Create unique file names
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.get("/news/images/:filename", (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(uploadDir, filename);
  logger.debug("Fetching image", { filename });

  // Check if the file exists
  if (fs.existsSync(imagePath)) {
    logger.info("Image served successfully", { filename });
    res.sendFile(imagePath); // Send the image file to the client
  } else {
    logger.warn("Image not found", { filename });
    res.status(404).json({ message: "Image not found" }); // If file not found
  }
});

router.get("/news", async (req, res) => {
  logger.debug("Fetching all news articles");
  try {
    const newsArticles = await newsService.getAllNews();
    logger.info("Successfully retrieved news articles", {
      count: newsArticles.length,
    });
    res.status(200).json(newsArticles);
  } catch (error) {
    logger.error("Error fetching news articles", { error: error.message });
    res.status(500).json({ message: error.message });
  }
});

router.post("/news", upload.single("imageFile"), async (req, res) => {
  try {
    logger.debug("Creating news article", { title: req.body.title });
    logger.debug("File upload info", {
      file: req.file ? req.file.filename : "none",
    });

    const { title, content, postedToFacebook, postedToInstagram } = req.body;
    let imageUrl = req.body.imageUrl || "";

    // If an image file was uploaded, save the file URL
    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`; // Return the relative path
      logger.debug("Image uploaded with article", {
        filename: req.file.filename,
      });
    }

    const newNews = await newsService.createNews({
      title,
      content,
      imageUrl,
      postedToFacebook: postedToFacebook === "true",
      postedToInstagram: postedToInstagram === "true",
    });

    logger.info("News article created successfully", { id: newNews._id });
    res.status(201).json(newNews);
  } catch (error) {
    logger.error("Error creating news article", { error: error.message });
    res.status(500).json({ message: error.message });
  }
});

router.put("/news/:id/image", upload.single("imageFile"), async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug("Updating news image", { id });

    const { imageUrl } = req.body;
    let imageFileUrl = imageUrl;

    // If an image file was uploaded, use its path
    if (req.file) {
      imageFileUrl = `/uploads/images/${req.file.filename}`;
      logger.debug("New image uploaded", { filename: req.file.filename });
    }

    const updatedNews = await newsService.updateNewsImage(id, imageFileUrl);
    logger.info("News image updated successfully", { id });
    res.status(200).json(updatedNews);
  } catch (error) {
    logger.error("Error updating news image", {
      id: req.params.id,
      error: error.message,
    });
    res.status(500).json({ message: error.message });
  }
});

router.delete("/news/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug("Deleting news article", { id });

    const deletedNews = await newsService.deleteNews(id);
    logger.info("News article deleted successfully", { id });
    res.status(200).json(deletedNews);
  } catch (error) {
    logger.error("Error deleting news article", {
      id: req.params.id,
      error: error.message,
    });

    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
