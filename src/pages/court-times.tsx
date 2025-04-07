import React from "react";
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
} from "@mui/material";
import { Calendar, Home } from "lucide-react";
import CourtSchedule from "../components/CourtSchedule";

const CourtTimesPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      {/* Page Header */}
      <Box sx={{ my: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Home size={16} style={{ marginRight: 4 }} />
            Home
          </Link>
          <Link
            color="inherit"
            href="/booking"
            sx={{ display: "flex", alignItems: "center" }}
          >
            Booking
          </Link>
          <Typography
            color="text.primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Calendar size={16} style={{ marginRight: 4 }} />
            Court Times
          </Typography>
        </Breadcrumbs>

        <Typography variant="h3" component="h1" gutterBottom>
          Court Times
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Find and select available court times for your next booking. You can
          filter by time range and availability.
        </Typography>
      </Box>
      {/* Court Schedule Component */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <CourtSchedule />
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, py: 3, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Need help? Contact our support team at support@example.com or call
          (123) 456-7890
        </Typography>
      </Box>
    </Container>
  );
};

export default CourtTimesPage;
