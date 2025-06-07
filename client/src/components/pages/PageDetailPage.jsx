import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { get, post } from "../../utilities";
import BackButton from "../modules/BackButton";
import LoadingSpinner from "../modules/LoadingSpinner";
import { useAuth } from "../../auth"; // Import useAuth

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

const ProblemDetailPage = () => {
  const { problemId } = useParams();
  const { currentUser, isLoading: authLoading } = useAuth(); // Get auth state
  const navigate = useNavigate(); // For redirecting to login

  const [problem, setProblem] = useState(null);
  const [problemLoading, setProblemLoading] = useState(true); // Renamed to avoid conflict
  const [error, setError] = useState(null);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [submissionStatus, setSubmissionStatus] = useState({ type: "", message: "" }); // {type: 'success' | 'error', message: string}
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setProblemLoading(true);
    setError(null);
    get(`/api/problem/${problemId}`)
      .then((data) => {
        setProblem(data);
        setProblemLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch problem details:", err);
        setError(
          `Failed to load problem ${problemId}. It might not exist or there was a server error.`
        );
        setProblemLoading(false);
      });
  }, [problemId]);

  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSubmitCode = () => {
    if (!currentUser) {
      // Redirect to login page, passing the current page as 'from'
      navigate("/login", { state: { from: { pathname: `/problem/${problemId}` } } });
      return;
    }
    if (!code.trim()) {
      setSubmissionStatus({ type: "error", message: "Code cannot be empty." });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus({ type: "", message: "Submitting..." }); // Clear previous and indicate submitting

    post(`/api/submit/${problemId}`, { code, language })
      .then((response) => {
        // console.log("Submission successful:", response);
        setSubmissionStatus({
          type: "success",
          message: `Submission successful! Server says: ${response.msg}`,
        });
        // Potentially clear code or redirect to a submissions page
        setCode(""); // Clear code on successful submission
      })
      .catch((err) => {
        console.error("Submission failed:", err);
        const errorMsg =
          err.response?.data?.msg || err.message || "Submission failed. Please try again.";
        setSubmissionStatus({ type: "error", message: errorMsg });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (problemLoading || authLoading) {
    // Check both problem and auth loading
    return <LoadingSpinner fullPage={true} message="Loading problem details..." />;
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5, position: "relative" }}>
        <BackButton />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!problem) {
    return (
      <Container sx={{ textAlign: "center", mt: 5, position: "relative" }}>
        <BackButton />
        <Typography variant="h6">Problem not found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 8, sm: 4 }, mb: 4, position: "relative" }}>
      {" "}
      {/* Added top margin for mobile */}
      <BackButton />
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Problem Details */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
          {problem.problem_name} ({problem.problem_id})
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Difficulty:{" "}
          <Typography
            component="span" // Changed from span to Typography for consistency
            sx={{
              color:
                problem.problem_difficulty === "hard"
                  ? "error.main" // Using theme colors
                  : problem.problem_difficulty === "medium"
                  ? "warning.main"
                  : "success.main",
              fontWeight: "bold",
            }}
          >
            {problem.problem_difficulty}
          </Typography>
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          {/* Consider using a Markdown renderer here for problem.content */}
          <Typography variant="body1" component="div" sx={{ whiteSpace: "pre-wrap" }}>
            {problem.content || "No description provided."}
          </Typography>
        </Box>

        {/* Input/Output Format, Constraints, Examples */}
        {/* ... (existing sections for inputFormat, outputFormat, constraints) ... */}

        {problem.examples && problem.examples.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Examples
            </Typography>
            {problem.examples.map((example, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{ p: 2, mb: 2, backgroundColor: "grey.100" }} // Using theme grey
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  Example {index + 1}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "medium", mt: 1 }}>
                  Input:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all", // Ensure long unbreakable strings wrap
                    backgroundColor: "grey.200", // Using theme grey
                    p: 1,
                    borderRadius: 1,
                    mt: 0.5,
                    fontFamily: "monospace",
                  }}
                >
                  {example.input}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: "medium", mt: 1 }}>
                  Output:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    backgroundColor: "grey.200",
                    p: 1,
                    borderRadius: 1,
                    mt: 0.5,
                    fontFamily: "monospace",
                  }}
                >
                  {example.output}
                </Box>
                {example.explanation && (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: "medium", mt: 1 }}>
                      Explanation:
                    </Typography>
                    <Typography
                      variant="body2"
                      component="div"
                      sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}
                    >
                      {example.explanation}
                    </Typography>
                  </>
                )}
              </Paper>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Submit Solution Section */}
        <Typography variant="h5" component="h2" gutterBottom>
          Submit Solution
        </Typography>
        <Grid container spacing={2} alignItems="flex-start">
          {" "}
          {/* Changed to flex-start */}
          <Grid item xs={12} sm={4} md={3}>
            {" "}
            {/* Adjusted grid size */}
            <FormControl fullWidth>
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={language}
                label="Language"
                onChange={handleLanguageChange}
              >
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="c">C</MenuItem>
                <MenuItem value="java">Java</MenuItem>
                <MenuItem value="cpp">C++</MenuItem>
                {/* Add other supported languages from your README */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Enter your code here"
              multiline
              rows={15}
              value={code}
              onChange={handleCodeChange}
              variant="outlined"
              fullWidth
              InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.9rem" } }}
              placeholder="// Your amazing code goes here..."
            />
          </Grid>
          <Grid item xs={12}>
            {" "}
            {/* Full width for button on xs, auto on sm */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitCode}
              disabled={isSubmitting || authLoading} // Disable if submitting or auth state is loading
              sx={{ mt: { xs: 1, sm: 0 }, width: { xs: "100%", sm: "auto" } }} // Full width on xs
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : currentUser ? (
                "Submit Code"
              ) : (
                "Login to Submit"
              )}
            </Button>
          </Grid>
        </Grid>
        {submissionStatus.message && (
          <Alert
            severity={submissionStatus.type || "info"} // Default to 'info' if type is empty
            sx={{ mt: 2 }}
          >
            {submissionStatus.message}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ProblemDetailPage;
