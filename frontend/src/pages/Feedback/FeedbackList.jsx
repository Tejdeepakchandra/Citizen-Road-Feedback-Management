import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  Avatar,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  useTheme,
} from "@mui/material";

import { Search } from "@mui/icons-material";
import { motion } from "framer-motion";
import { feedbackAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const itemsPerPage = 8;
  const theme = useTheme();
  const { user } = useAuth();

  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, search, sort]);

  const loadFeedback = async () => {
    try {
      const res = await feedbackAPI.getMyFeedback();
      const list = res.data.data || [];
      setFeedbacks(list);
    } catch (err) {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let list = [...feedbacks];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.comment?.toLowerCase().includes(s) ||
          f.report?.title?.toLowerCase().includes(s)
      );
    }

    list.sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "highest") return b.rating - a.rating;
      if (sort === "lowest") return a.rating - b.rating;
      return 0;
    });

    setFiltered(list);
    setPage(1);
  };

  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getRatingColor = (rating) => {
    if (rating >= 4) return "#22c55e"; // Green
    if (rating === 3) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          My Feedback
        </Typography>
        <Typography color="text.secondary">
          All the feedback you submitted on completed reports.
        </Typography>
      </Box>

      {/* SEARCH + SORT */}
      <Paper
        elevation={isDark ? 1 : 0}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 3,
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #eee",
          background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
        }}
      >
        <Grid container spacing={2}>
          {/* SEARCH */}
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              placeholder="Search your feedback..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* SORT */}
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              select
              label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="highest">Highest Rating</MenuItem>
              <MenuItem value="lowest">Lowest Rating</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* FEEDBACK LIST */}
      <Grid container spacing={3}>
        {paginated.map((f) => (
          <Grid item xs={12} key={f._id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                elevation={isDark ? 2 : 0}
                sx={{
                  borderRadius: 3,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid #eee",
                  background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                }}
              >
                <CardContent>
                  {/* TOP SECTION */}
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getRatingColor(f.rating),
                          color: "#fff",
                        }}
                      >
                        {user?.name?.charAt(0)}
                      </Avatar>

                      <Box>
                        <Typography fontWeight={700}>{user?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(f.createdAt), "dd MMM yyyy, hh:mm a")}
                        </Typography>
                      </Box>
                    </Box>

                    {/* RATING */}
                    <Box sx={{ textAlign: "right" }}>
                      <Rating
                        value={f.rating}
                        readOnly
                        size="medium"
                        sx={{
                          "& .MuiRating-iconFilled": {
                            color: getRatingColor(f.rating),
                          },
                        }}
                      />
                      <Chip
                        label={`${f.rating} / 5`}
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: getRatingColor(f.rating) + "20",
                          color: getRatingColor(f.rating),
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* COMMENT */}
                  <Typography sx={{ mt: 2, mb: 1, fontSize: "1rem" }}>
                    "{f.comment}"
                  </Typography>

                  {/* REPORT BLOCK */}
                  {f.report && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f9fafb",
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.1)"
                          : "1px solid #eee",
                      }}
                    >
                      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                        Related Report: {f.report.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {f.report.description?.substring(0, 120)}...
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* PAGINATION */}
      {filtered.length > itemsPerPage && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Pagination
            page={page}
            onChange={(e, v) => setPage(v)}
            count={Math.ceil(filtered.length / itemsPerPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
};

export default FeedbackList;
