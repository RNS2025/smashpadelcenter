import api from "../api/api";
import { News } from "../types/news";

// Fetch all news articles
const getNews = async (): Promise<News[]> => {
  try {
    const response = await api.get("/news");
    return response.data.map((item: any) => ({
      ...item,
      id: item._id || item.id,
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};

// Fetch image by filename
const getImage = async (filename: string): Promise<string> => {
  try {
    const response = await api.get(`/news/images/${filename}`, {
      responseType: "blob", // Tell axios to expect a binary response
    });
    // Create a URL from the blob for use in the frontend
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    throw error;
  }
};

// Post news to social media (Facebook, Instagram)
const postNews = async (
  newsId: number,
  postToFacebook: boolean,
  postToInstagram: boolean
): Promise<any> => {
  try {
    const response = await api.post("/post-news", {
      newsId,
      postToFacebook,
      postToInstagram,
    });
    return response.data;
  } catch (error) {
    console.error("Error posting news:", error);
    throw new Error("Error posting news");
  }
};

// Create new news article
const createNews = async (newsData: FormData | News): Promise<News> => {
  try {
    let response;
    if (newsData instanceof FormData) {
      response = await api.post("/news", newsData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      const { id, ...newsWithoutClientId } = newsData as News;
      response = await api.post("/news", newsWithoutClientId);
    }
    const createdNews = response.data;
    return {
      ...createdNews,
      id: createdNews._id || createdNews.id,
    };
  } catch (error) {
    console.error("Error creating news:", error);
    throw error;
  }
};

// Update the updateImage function to handle FormData
const updateImage = async (
  id: number | string,
  data: FormData | string
): Promise<void> => {
  try {
    if (data instanceof FormData) {
      await api.put(`/news/${id}/image`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      await api.put(`/news/${id}/image`, { imageUrl: data });
    }
  } catch (error) {
    console.error("Error updating image:", error);
    throw error;
  }
};

// Get a specific news article by ID
const getNewsById = async (id: number): Promise<News> => {
  try {
    const response = await api.get(`/news/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching news by ID:", error);
    throw new Error("Error fetching news by ID");
  }
};

// Delete a news article
const deleteNews = async (id: number | string): Promise<void> => {
  try {
    console.log(`Attempting to delete news with ID: ${id}`);
    await api.delete(`/news/${id}`);
  } catch (error) {
    console.error("Error deleting news:", error);
    throw error;
  }
};

export default {
  getNews,
  getImage,
  postNews,
  createNews,
  updateImage,
  getNewsById,
  deleteNews,
};
