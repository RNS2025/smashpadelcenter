import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import newsService from "../../services/newsService";
import { News } from "../../types/news";

// MUI Imports
import {
  Container,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Modal,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// React-Lucide Icons
import { Facebook, Instagram } from "lucide-react";

const NewsPage: React.FC = () => {
  const { role } = useUser();
  const [news, setNews] = useState<News[]>([]);
  const [selectedNewsId, setSelectedNewsId] = useState<number | string | null>(
    null
  );
  const [focusedNewsId, setFocusedNewsId] = useState<number | string | null>(
    null
  ); // New state for focused news
  const [postToFacebook, setPostToFacebook] = useState(false);
  const [postToInstagram, setPostToInstagram] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [imageError, setImageError] = useState<string | null>(null);

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await newsService.getNews();
      setNews(data);
      await fetchImages(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Error fetching news");
      setLoading(false);
    }
  };

  const fetchImages = async (newsItems: News[]) => {
    const urls: { [key: string]: string } = {};
    for (const item of newsItems) {
      if (item.imageUrl && !item.imageUrl.startsWith("blob:")) {
        try {
          const filename = item.imageUrl.split("/").pop() || item.imageUrl;
          const url = await newsService.getImage(filename);
          urls[item.id] = url;
        } catch (err) {
          console.error(`Error fetching image for news ${item.id}:`, err);
          urls[item.id] = "";
        }
      }
    }
    setImageUrls(urls);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedNewsId) {
      newsService
        .postNews(selectedNewsId, postToFacebook, postToInstagram)
        .then(() => {
          alert("News posted successfully!");
        })
        .catch((err) => {
          console.error("Error posting news:", err);
          alert("Error posting news!");
        });
    }
  };

  const handleNewNewsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("content", newContent);
      formData.append("postedToFacebook", String(postToFacebook));
      formData.append("postedToInstagram", String(postToInstagram));
      if (imageUrl && !imageUrl.startsWith("blob:")) {
        formData.append("imageUrl", imageUrl);
      }
      if (imageFile) {
        formData.append("imageFile", imageFile);
      }
      const createdNews = await newsService.createNews(formData);
      alert("News created successfully!");
      setNewTitle("");
      setNewContent("");
      setPostToFacebook(false);
      setPostToInstagram(false);
      setImageUrl("");
      setImageFile(null);
      setImageError(null);
      fetchNews();
    } catch (err) {
      console.error("Error creating news:", err);
      alert(`Error creating news: ${err.message || "Unknown error"}`);
    }
  };

  const handleUpdateImage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedNewsId) {
      alert("No news selected");
      return;
    }
    try {
      const formData = new FormData();
      if (imageUrl && !imageUrl.startsWith("blob:")) {
        formData.append("imageUrl", imageUrl);
      }
      if (imageFile) {
        formData.append("imageFile", imageFile);
      }
      await newsService.updateImage(selectedNewsId, formData);
      alert("Image updated successfully!");
      setImageUrl("");
      setImageFile(null);
      setImageError(null);
      fetchNews();
    } catch (err) {
      console.error("Error updating image:", err);
      alert(`Error updating image: ${err.message || "Unknown error"}`);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError(`Image size exceeds 2MB. Please choose a smaller file.`);
        setImageFile(null);
        setImageUrl("");
        return;
      }
      setImageError(null);
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
    }
  };

  const handleDeleteNews = async () => {
    if (!selectedNewsId) {
      alert("No news selected");
      return;
    }
    try {
      await newsService.deleteNews(selectedNewsId);
      setNews(news.filter((item) => item.id !== selectedNewsId));
      alert("News deleted successfully!");
      setSelectedNewsId(null);
      setFocusedNewsId(null); // Close modal if deleted
    } catch (err) {
      console.error("Error deleting news:", err);
      alert(`Error deleting news: ${err.message || "Unknown error"}`);
    }
  };

  const handleSelectNews = (
    newsId: number | string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setFocusedNewsId(newsId); // Open modal
    if (role === "admin") {
      setSelectedNewsId(newsId); // Set for admin actions
    }
  };

  const handleCloseModal = () => {
    setFocusedNewsId(null); // Close modal
    if (role !== "admin") {
      setSelectedNewsId(null); // Clear selection for non-admins
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  const focusedNews = news.find((item) => item.id === focusedNewsId);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        News Page
      </Typography>

      {role === "admin" && (
        <Box mb={4}>
          <Paper elevation={3} sx={{ padding: 2 }}>
            <Typography variant="h5" gutterBottom>
              Create New News
            </Typography>
            <form onSubmit={handleNewNewsSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Title"
                    variant="outlined"
                    fullWidth
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Content"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={postToFacebook}
                        onChange={() => setPostToFacebook(!postToFacebook)}
                      />
                    }
                    label="Post to Facebook"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={postToInstagram}
                        onChange={() => setPostToInstagram(!postToInstagram)}
                      />
                    }
                    label="Post to Instagram"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Image URL (optional)"
                    variant="outlined"
                    fullWidth
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  {imageError && (
                    <Typography color="error" variant="body2" mt={1}>
                      {imageError}
                    </Typography>
                  )}
                  {imageFile && (
                    <Box mt={2}>
                      <Typography variant="body2">Selected image:</Typography>
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        width="100"
                        height="100"
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary" type="submit">
                    Create News
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Box>
      )}

      <Typography variant="h5" gutterBottom>
        News List
      </Typography>
      <Grid container spacing={3} direction="column" alignItems="flex-start">
        {news.map((newsItem) => (
          <Grid item xs={12} key={newsItem.id}>
            <Card
              onClick={(e) => handleSelectNews(newsItem.id, e)}
              sx={{
                cursor: "pointer",
                border: selectedNewsId === newsItem.id ? "2px solid blue" : "",
                width: "72rem",
                height: "10rem",
                display: "flex",
                flexDirection: "row",
                overflow: "hidden",
              }}
            >
              {imageUrls[newsItem.id] && (
                <CardMedia
                  component="img"
                  sx={{
                    width: "20rem",
                    height: "100%",
                  }}
                  image={imageUrls[newsItem.id]}
                  alt={newsItem.title}
                />
              )}
              <CardContent
                sx={{
                  flex: 1,
                  padding: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "10rem",
                  overflowY: "auto",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}
                >
                  {newsItem.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  {new Date(newsItem.createdAt).toLocaleDateString()}
                </Typography>
                <Typography
                  variant="body1"
                  color="textPrimary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {newsItem.content}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal for Focused News */}
      <Modal
        open={!!focusedNewsId}
        onClose={handleCloseModal}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Paper
          sx={{
            width: "80vw",
            maxWidth: "900px",
            maxHeight: "80vh",
            overflowY: "auto",
            padding: "2rem",
            position: "relative",
          }}
        >
          <IconButton
            onClick={handleCloseModal}
            sx={{ position: "absolute", top: "1rem", right: "1rem" }}
          >
            <CloseIcon />
          </IconButton>
          {focusedNews && (
            <>
              <Box display="flex" flexDirection="row">
                {imageUrls[focusedNews.id] && (
                  <CardMedia
                    component="img"
                    sx={{
                      width: "40%",
                      height: "auto",
                      maxHeight: "50vh",
                      objectFit: "contain",
                      marginRight: "2rem",
                    }}
                    image={imageUrls[focusedNews.id]}
                    alt={focusedNews.title}
                  />
                )}
                <Box flex={1}>
                  <Typography variant="h4" gutterBottom>
                    {focusedNews.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    {new Date(focusedNews.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">{focusedNews.content}</Typography>
                </Box>
              </Box>

              {/* Admin Actions */}
              {role === "admin" && selectedNewsId === focusedNewsId && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>
                    Admin Actions
                  </Typography>
                  <form onSubmit={handleFormSubmit}>
                    <Typography variant="subtitle1" gutterBottom>
                      Select Posting Options
                    </Typography>
                    <Box display="flex" alignItems="center" mb={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={postToFacebook}
                            onChange={() => setPostToFacebook(!postToFacebook)}
                            icon={<Facebook />}
                            checkedIcon={<Facebook color="primary" />}
                          />
                        }
                        label="Post to Facebook"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={postToInstagram}
                            onChange={() =>
                              setPostToInstagram(!postToInstagram)
                            }
                            icon={<Instagram />}
                            checkedIcon={<Instagram color="primary" />}
                          />
                        }
                        label="Post to Instagram"
                      />
                      <Button
                        variant="contained"
                        color="secondary"
                        type="submit"
                      >
                        Post News
                      </Button>
                    </Box>
                  </form>

                  <Box mt={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Update News Image
                    </Typography>
                    <form onSubmit={handleUpdateImage}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="New Image URL (optional)"
                            variant="outlined"
                            fullWidth
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <input
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                          />
                          {imageError && (
                            <Typography color="error" variant="body2" mt={1}>
                              {imageError}
                            </Typography>
                          )}
                          {imageFile && (
                            <Box mt={2}>
                              <Typography variant="body2">
                                Selected image:
                              </Typography>
                              <img
                                src={URL.createObjectURL(imageFile)}
                                alt="Preview"
                                width="100"
                                height="100"
                              />
                            </Box>
                          )}
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            color="secondary"
                            type="submit"
                          >
                            Update Image
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </Box>

                  <Box mt={4}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleDeleteNews}
                      disabled={!selectedNewsId}
                    >
                      Delete News
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Modal>
    </Container>
  );
};

export default NewsPage;
