const News = require("../models/newsModel");

/**
 * Create a new news article
 * @param {Object} newsData - Data for the news article
 * @returns {Promise<Object>} - The created news article
 */
async function createNews(newsData) {
  try {
    const newNewsData = {
      title: newsData.title,
      content: newsData.content,
      imageUrl: newsData.imageUrl || "",
      postedToFacebook: newsData.postedToFacebook || false,
      postedToInstagram: newsData.postedToInstagram || false,
      createdAt: newsData.createdAt || new Date().toISOString(),
    };

    const newNews = new News(newNewsData);
    await newNews.save();
    return newNews;
  } catch (error) {
    console.error("Error in createNews service:", error);
    throw new Error("Error creating news article: " + error.message);
  }
}

/**
 * Get all news articles
 * @returns {Promise<Array>} - List of all news articles
 */
async function getAllNews() {
  try {
    return await News.find();
  } catch (error) {
    throw new Error("Error fetching news articles: " + error.message);
  }
}

/**
 * Get a single news article by ID
 * @param {String} newsId - The ID of the news article
 * @returns {Promise<Object>} - The news article
 */
async function getNewsById(newsId) {
  try {
    return await News.findById(newsId);
  } catch (error) {
    throw new Error("Error fetching news article by ID: " + error.message);
  }
}

/**
 * Update a news article image URL
 * @param {String} newsId - The ID of the news article
 * @param {String} imageUrl - The new image URL
 * @returns {Promise<Object>} - The updated news article
 */
async function updateNewsImage(newsId, imageUrl) {
  try {
    const news = await News.findById(newsId);
    if (!news) throw new Error("News article not found");

    news.imageUrl = imageUrl;
    await news.save();
    return news;
  } catch (error) {
    throw new Error("Error updating news article image: " + error.message);
  }
}

/**
 * Delete a news article by ID
 * @param {String} newsId - The ID of the news article
 * @returns {Promise<Object>} - The deleted news article
 */
async function deleteNews(newsId) {
  try {
    const news = await News.findById(newsId);
    if (!news) throw new Error("News article not found");

    // Use deleteOne instead of the deprecated remove method
    await News.deleteOne({ _id: newsId });
    return news;
  } catch (error) {
    console.error("Error in deleteNews service:", error);
    throw new Error("Error deleting news article: " + error.message);
  }
}

module.exports = {
  createNews,
  getAllNews,
  getNewsById,
  updateNewsImage,
  deleteNews,
};
