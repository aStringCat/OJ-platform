import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { get } from "../../utilities";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

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

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const requests = [get("/api/problems")];
        if (currentUser) {
          requests.push(get("/api/submissions"));
        }
        const [problemData, submissionData = []] = await Promise.all(requests);
        if (!cancelled) {
          setProblems(problemData);
          setSubmissions(submissionData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.data?.msg || err.message || "Failed to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>Loading dashboard...</Typography>
      </Container>
    );
  }

  const acceptedSubmissions = submissions.filter((submission) => submission.status === "Accepted");
  const solvedProblems = new Set(
    acceptedSubmissions.map((submission) => submission.problem?._id).filter(Boolean)
  ).size;

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 6, sm: 8 }, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
        {currentUser ? `${currentUser.name}'s Dashboard` : "Dashboard"}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {currentUser
          ? "Track your progress and continue solving problems."
          : "Browse the problem set or sign in to track your progress."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography color="text.secondary">Available Problems</Typography>
            <Typography variant="h3" sx={{ fontWeight: "bold", my: 1 }}>
              {problems.length}
            </Typography>
            <Button component={Link} to="/problems" size="small">
              Browse problems
            </Button>
          </Paper>
        </Grid>
        {currentUser ? (
          <>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                <Typography color="text.secondary">Problems Solved</Typography>
                <Typography variant="h3" sx={{ fontWeight: "bold", my: 1 }}>
                  {solvedProblems}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {acceptedSubmissions.length} accepted submissions
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                <Typography color="text.secondary">Total Submissions</Typography>
                <Typography variant="h3" sx={{ fontWeight: "bold", my: 1 }}>
                  {submissions.length}
                </Typography>
                <Button component={Link} to="/submissions" size="small">
                  View history
                </Button>
              </Paper>
            </Grid>
          </>
        ) : (
          <Grid size={{ xs: 12, sm: 8 }}>
            <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                Save your progress
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Sign in to submit solutions and review your results.
              </Typography>
              <Button component={Link} to="/login" variant="contained">
                Log in or sign up
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {currentUser && (
        <Paper elevation={2} sx={{ mt: 3, p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Recent Submissions
            </Typography>
            <Button component={Link} to="/submissions" size="small">
              View all
            </Button>
          </Box>
          {submissions.length === 0 ? (
            <Typography color="text.secondary">You have not made any submissions yet.</Typography>
          ) : (
            submissions.slice(0, 5).map((submission) => (
              <Box
                key={submission._id}
                component={Link}
                to={`/submission/${submission._id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 1.5,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 500 }}>
                    {submission.problem?.problem_name || "Problem not found"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {submission.language} · {new Date(submission.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  label={submission.status}
                  color={getStatusColor(submission.status)}
                  size="small"
                />
              </Box>
            ))
          )}
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;
