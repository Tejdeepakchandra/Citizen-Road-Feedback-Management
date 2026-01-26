import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Rating,
  Chip,
  Avatar,
  Alert,
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
  Star,
  ThumbUp,
  Comment,
  ArrowBack,
  CheckCircle,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { feedbackAPI, reportAPI } from "../../../services/api";
import { toast } from "react-hot-toast";

const GiveFeedback = () => {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: "",
    helpful: false,
    anonymous: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchReportAndFeedback();
  }, [reportId]);

  const fetchReportAndFeedback = async () => {
    setLoading(true);
    try {
      const [reportRes, feedbackRes] = await Promise.all([
        reportAPI.getReportById(reportId),
        feedbackAPI.getFeedbackByReport(reportId)

      ]);

      setReport(reportRes.data.data || reportRes.data);

      const allFeedback = feedbackRes.data.data || [];

      const userFeedback = allFeedback.find((f) => f.user?._id === user?._id);

      if (userFeedback) {
        setExistingFeedback(userFeedback);
        setFeedback({
          rating: userFeedback.rating,
          comment: userFeedback.comment,
          helpful: userFeedback.helpful || false,
          anonymous: userFeedback.anonymous || false,
        });
      }
    } catch (error) {
      toast.error("Failed to load report details");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (event, newValue) => {
    setFeedback({ ...feedback, rating: newValue });
  };

  const handleCommentChange = (event) => {
    setFeedback({ ...feedback, comment: event.target.value });
  };

  const handleSubmit = async () => {
    console.log("Submit clicked");

    if (!feedback.rating) {
      toast.error("Please select a rating");
      return;
    }

    if (!feedback.comment.trim()) {
      toast.error("Please write your feedback");
      return;
    }

    setSubmitting(true);
    try {
      if (existingFeedback) {
        await feedbackAPI.updateFeedback(existingFeedback._id, {
  ...feedback,
  reportId,
});


        toast.success("Feedback updated successfully!");
      } else {
      await feedbackAPI.createFeedback({
  ...feedback,
  reportId,
});


        toast.success("Thank you for your feedback!");
      }

      navigate(`/reports/${reportId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabels = {
    1: "Very Poor",
    2: "Poor",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <LinearProgress sx={{ width: "100%" }} />
        </Box>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 2 }}>
          Report not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/reports/${reportId}`)}
            sx={{ mb: 2 }}
          >
            Back to Report
          </Button>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Share Your Feedback
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tell us about your experience with the completed work
          </Typography>
        </Box>

        {/* Report Summary */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Report Summary
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.success.main,
                }}
              >
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {report.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed on {new Date(report.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              {report.description}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip label={report.category} size="small" />
              <Chip label={report.severity} size="small" color="primary" />
              <Chip label="Completed" size="small" color="success" />
            </Box>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {existingFeedback ? "Update Your Feedback" : "How was the work?"}
            </Typography>

            {/* Rating */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Overall Rating
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Rating
                  value={feedback.rating}
                  onChange={handleRatingChange}
                  size="large"
                />
                {feedback.rating > 0 && (
                  <Chip
                    label={getRatingLabels[feedback.rating]}
                    color={
                      feedback.rating >= 4
                        ? "success"
                        : feedback.rating >= 3
                        ? "warning"
                        : "error"
                    }
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Rate the quality of work completed
              </Typography>
            </Box>

            {/* Comment */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Your Feedback
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Tell us about your experience. Was the work completed on time? Was the quality good? Any suggestions for improvement?"
                value={feedback.comment}
                onChange={handleCommentChange}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Be specific about what you liked or didn't like
              </Typography>
            </Box>

            {/* Helpful Questions */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Additional Questions
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Button
                  variant={feedback.helpful ? "contained" : "outlined"}
                  startIcon={<ThumbUp />}
                  onClick={() =>
                    setFeedback({ ...feedback, helpful: !feedback.helpful })
                  }
                  sx={{
                    backgroundColor: feedback.helpful
                      ? theme.palette.success.main + "20"
                      : "transparent",
                    color: feedback.helpful
                      ? theme.palette.success.main
                      : "inherit",
                    borderColor: feedback.helpful
                      ? theme.palette.success.main
                      : undefined,
                  }}
                >
                  Work was helpful
                </Button>
                <Button
                  variant={feedback.anonymous ? "contained" : "outlined"}
                  onClick={() =>
                    setFeedback({ ...feedback, anonymous: !feedback.anonymous })
                  }
                  sx={{
                    backgroundColor: feedback.anonymous
                      ? theme.palette.grey[500] + "20"
                      : "transparent",
                    color: feedback.anonymous
                      ? theme.palette.grey[700]
                      : "inherit",
                    borderColor: feedback.anonymous
                      ? theme.palette.grey[500]
                      : undefined,
                  }}
                >
                  Post anonymously
                </Button>
              </Box>
            </Box>

            {/* Tips */}
            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="body2">
                <strong>Tip:</strong> Your feedback helps improve our services
                and ensures better quality work for everyone.
              </Typography>
            </Alert>

            {/* Submit Button */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/reports/${reportId}`)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  submitting || !feedback.rating || !feedback.comment.trim()
                }
                sx={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  minWidth: 120,
                }}
              >
                {submitting
                  ? "Submitting..."
                  : existingFeedback
                  ? "Update Feedback"
                  : "Submit Feedback"}
              </Button>
            </Box>

            {existingFeedback && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You can update your previous feedback. This will replace your
                existing rating and comments.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Example Feedback */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Example of Good Feedback
            </Typography>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
              }}
            >
              <Typography
                variant="body1"
                fontStyle="italic"
                color="text.secondary"
                paragraph
              >
                "The pothole repair work was completed within 2 days of
                reporting. The quality is excellent - the patch is smooth and
                blends well with the road. The staff was professional and
                cleaned up after the work. Very satisfied!"
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Rating value={5} readOnly size="small" />
                <Typography variant="caption" color="text.secondary">
                  Posted by: Satisfied Citizen
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default GiveFeedback;
