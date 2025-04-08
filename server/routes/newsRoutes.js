const express = require("express");
const newsService = require("../Services/newsService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the 'uploads/images' directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

/**
 * @swagger
 * /api/v1/news/images/{filename}:
 *   get:
 *     summary: Fetch image by filename
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         description: The filename of the image to fetch
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image file successfully fetched
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 */
router.get("/news/images/:filename", (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(uploadDir, filename);

  // Check if the file exists
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath); // Send the image file to the client
  } else {
    res.status(404).json({ message: "Image not found" }); // If file not found
  }
});

/**
 * @swagger
 * /api/v1/news:
 *   get:
 *     summary: Get all news articles
 *     tags: [News]
 *     responses:
 *       200:
 *         description: List of news articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/News'
 *       500:
 *         description: Error fetching news articles
 */
router.get("/news", async (req, res) => {
  try {
    const newsArticles = await newsService.getAllNews();
    res.status(200).json(newsArticles);
  } catch (error) {
    console.error("Error in GET /news:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news:
 *   post:
 *     summary: Create a new news article
 *     tags: [News]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 description: The URL of the image (optional)
 *               imageFile:
 *                 type: string
 *                 description: The image file (optional, to be uploaded)
 *     responses:
 *       201:
 *         description: News article created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/News'
 *       500:
 *         description: Error creating news article
 */
router.post("/news", upload.single("imageFile"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("File:", req.file);

    const { title, content, postedToFacebook, postedToInstagram } = req.body;
    let imageUrl = req.body.imageUrl || "";

    // If an image file was uploaded, save the file URL
    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`; // Return the relative path
    }

    const newNews = await newsService.createNews({
      title,
      content,
      imageUrl,
      postedToFacebook: postedToFacebook === "true",
      postedToInstagram: postedToInstagram === "true",
    });

    res.status(201).json(newNews);
  } catch (error) {
    console.error("Error in POST /news:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/{id}/image:
 *   put:
 *     summary: Update the image URL of a news article
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the news article
 *         schema:
 *           type: string
 *       - in: body
 *         name: imageUrl
 *         required: true
 *         description: The new image URL or image file
 *         schema:
 *           type: object
 *           properties:
 *             imageUrl:
 *               type: string
 *     responses:
 *       200:
 *         description: News article updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/News'
 *       404:
 *         description: News article not found
 *       500:
 *         description: Error updating image URL
 */
router.put("/news/:id/image", upload.single("imageFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    let imageFileUrl = imageUrl;

    // If an image file was uploaded, use its path
    if (req.file) {
      imageFileUrl = `/uploads/images/${req.file.filename}`;
    }

    const updatedNews = await newsService.updateNewsImage(id, imageFileUrl);
    res.status(200).json(updatedNews);
  } catch (error) {
    console.error("Error updating news image:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/news/{id}:
 *   delete:
 *     summary: Delete a news article
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the news article
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News article deleted
 *       404:
 *         description: News article not found
 *       500:
 *         description: Error deleting news article
 */
router.delete("/news/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting news with ID:", id);

    const deletedNews = await newsService.deleteNews(id);
    res.status(200).json(deletedNews);
  } catch (error) {
    console.error("Error in DELETE /news/:id:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
