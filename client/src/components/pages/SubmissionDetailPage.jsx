import { useState, useEffect } from "react";
import { Navigate, useLocation, useParams, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../auth";
import { get } from "../../utilities";
import BackButton from "../modules/BackButton";
import CodeBlock from "../modules/CodeBlock";
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
    case "Runtime Error":
    case "System Error":
      return "error";
    case "Time Limit Exceeded":
    case "Memory Limit Exceeded":
    case "Output Limit Exceeded":
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
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let refreshTimer;

    const loadSubmission = (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }
      get(`/api/submission/${submissionId}`)
        .then((data) => {
          if (cancelled) return;
          setSubmission(data);
          setError(null);
          if (["Pending", "Judging"].includes(data.status)) {
            refreshTimer = window.setTimeout(() => loadSubmission(), 1500);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("Failed to fetch submission:", err);
          setError(err.data?.msg || err.message || "Failed to load submission details.");
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    };

    loadSubmission(true);
    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
    };
  }, [submissionId, currentUser]);

  if (authLoading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
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
              {submission.problem ? (
                <Link component={RouterLink} to={`/problem/${submission.problem.problem_id}`}>
                  {submission.problem.problem_name}
                </Link>
              ) : (
                "Problem not found"
              )}
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

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Passed cases: {submission.passedCases || 0} · Maximum case wall time:{" "}
          {submission.executionTimeMs || 0} ms
        </Typography>
        {submission.message && (
          <Alert severity="info" sx={{ mb: 2, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {submission.message}
          </Alert>
        )}

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: "bold" }}>
          Source Code
        </Typography>
        <CodeBlock language={submission.language}>{submission.code}</CodeBlock>
      </Paper>
    </Container>
  );
};

export default SubmissionDetailPage;
