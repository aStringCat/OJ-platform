import { useState, useEffect } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../auth";
import { get } from "../../utilities";
import BackButton from "../modules/BackButton";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Link,
  Divider,
} from "@mui/material";

const getStatusColor = (status) => {
  switch (status) {
    case "Accepted":
      return "success";
    case "Wrong Answer":
    case "Compilation Error":
      return "error";
    case "Time Limit Exceeded":
      return "warning";
    case "Pending":
      return "info";
    default:
      return "secondary";
  }
};

const SubmissionDetailPage = () => {
  const { submissionId } = useParams();
  const { currentUser, isLoading: authLoading } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      get(`/api/submission/${submissionId}`)
        .then((data) => {
          setSubmission(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch submission:", err);
          setError("Failed to load submission details. You may not have permission to view this.");
          setLoading(false);
        });
    }
  }, [submissionId, currentUser]);

  if (authLoading || loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <BackButton />
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <BackButton />
        <Typography>Submission not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, position: "relative" }}>
        <BackButton />
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ textAlign: "center", fontWeight: "bold" }}
        >
          Submission Details
        </Typography>

        <Grid container spacing={2}>
          <Grid>
            <Typography variant="h6">
              Problem:{" "}
              <Link component={RouterLink} to={`/problem/${submission.problem.problem_id}`}>
                {submission.problem.problem_name}
              </Link>
            </Typography>
          </Grid>
          <Grid>
            <Typography variant="h6">
              Status: <Chip label={submission.status} color={getStatusColor(submission.status)} />
            </Typography>
          </Grid>
          <Grid>
            <Typography variant="h6">Language: {submission.language}</Typography>
          </Grid>
          <Grid>
            <Typography variant="h6">
              Submitted: {new Date(submission.createdAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: "bold" }}>
          Source Code
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: "#1e1e1e", // A dark background for the code
            color: "#d4d4d4",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap", // Ensures code wraps correctly
            wordBreak: "break-all",
            maxHeight: "600px",
            overflow: "auto",
          }}
        >
          {submission.code}
        </Paper>
      </Paper>
    </Container>
  );
};

export default SubmissionDetailPage;
