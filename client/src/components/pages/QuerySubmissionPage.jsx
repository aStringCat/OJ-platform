import { useState, useEffect } from "react";
import { useAuth } from "../../auth";
import { get } from "../../utilities";
import { Link as RouterLink, Navigate } from "react-router-dom";

import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  Chip,
  Link,
} from "@mui/material";
import BackButton from "../modules/BackButton";

const ITEMS_PER_PAGE = 20;

const getStatusColor = (status) => {
  switch (status) {
    case "Accepted":
      return "success";
    case "Wrong Answer":
      return "error";
    case "Compilation Error":
      return "error";
    case "Time Limit Exceeded":
      return "warning";
    case "Pending":
      return "info";
    case "Judging":
      return "secondary";
    default:
      return "default";
  }
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "easy":
      return "green";
    case "medium":
      return "orange";
    case "hard":
      return "red";
    default:
      return "inherit";
  }
};

const QuerySubmission = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      get("/api/submissions")
        .then((data) => {
          setSubmissions(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch submissions:", err);
          setError("Failed to load submission history. Please try again later.");
          setLoading(false);
        });
    }
  }, [currentUser]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedSubmissions = submissions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (authLoading || loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>Loading submissions...</Typography>
      </Container>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, position: "relative" }}>
        <BackButton sx={{ top: { xs: 16, sm: 24 }, left: { xs: 16, sm: 24 } }} />
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            pt: { xs: 4, sm: 0 },
          }}
        >
          My Submissions
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {!error && submissions.length === 0 && (
          <Typography sx={{ textAlign: "center", mt: 3 }}>
            You have not made any submissions yet.
          </Typography>
        )}
        {!error && submissions.length > 0 && (
          <>
            <TableContainer>
              <Table stickyHeader aria-label="submission history table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Problem ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Problem Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Difficulty</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Submitted At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSubmissions.map((sub) => (
                    <TableRow
                      key={sub._id}
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Link component={RouterLink} to={`/problem/${sub.problem?.problem_id}`}>
                          {sub.problem?.problem_id || "N/A"}
                        </Link>
                      </TableCell>
                      <TableCell>{sub.problem?.problem_name || "Problem not found"}</TableCell>
                      <TableCell>
                        <Typography
                          component="span"
                          sx={{
                            color: getDifficultyColor(sub.problem?.problem_difficulty),
                            fontWeight: "medium",
                          }}
                        >
                          {sub.problem?.problem_difficulty || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={sub.status} color={getStatusColor(sub.status)} size="small" />
                      </TableCell>
                      <TableCell>{new Date(sub.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={Math.ceil(submissions.length / ITEMS_PER_PAGE)}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default QuerySubmission;