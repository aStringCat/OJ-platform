import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get, post } from "../../utilities"; // Assuming post utility for submission
import BackButton from "../modules/BackButton";

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
import Grid from "@mui/material/Grid"; // For layout
import Divider from "@mui/material/Divider"; // For separation

const ProblemDetailPage = () => {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python"); // Default language
  const [submissionStatus, setSubmissionStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    get(`/api/problem/${problemId}`)
      .then((data) => {
        setProblem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch problem details:", err);
        setError(
          `Failed to load problem ${problemId}. It might not exist or there was a server error.`
        );
        setLoading(false);
      });
  }, [problemId]);

  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSubmitCode = () => {
    setSubmissionStatus("Submitting...");
    post(`/api/submit/${problemId}`, { code, language })
      .then((response) => {
        console.log("Submission successful:", response);
        setSubmissionStatus(`Submission successful! (Mock response: ${response.msg})`);
        // Potentially redirect to submissions page or show result
      })
      .catch((err) => {
        console.error("Submission failed:", err);
        setSubmissionStatus("Submission failed. Please try again.");
      });
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5, position: "relative" }}>
        <BackButton />
        <CircularProgress />
        <Typography>Loading problem details...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5, position: "relative" }}>
        <BackButton />
        <Typography color="error" variant="h6">
          {error}
        </Typography>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: "relative" }}>
      <BackButton />
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
          {problem.problem_name} ({problem.problem_id})
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Difficulty:{" "}
          <span
            style={{
              color:
                problem.problem_difficulty === "hard"
                  ? "red"
                  : problem.problem_difficulty === "medium"
                  ? "orange"
                  : "green",
              fontWeight: "bold",
            }}
          >
            {problem.problem_difficulty}
          </span>
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {problem.content || "No description provided."}
          </Typography>
        </Box>

        {problem.inputFormat && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Input Format
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {problem.inputFormat}
            </Typography>
          </Box>
        )}

        {problem.outputFormat && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Output Format
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {problem.outputFormat}
            </Typography>
          </Box>
        )}

        {problem.constraints && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Constraints
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {problem.constraints}
            </Typography>
          </Box>
        )}

        {problem.examples && problem.examples.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Examples
            </Typography>
            {problem.examples.map((example, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{ p: 2, mb: 2, backgroundColor: "#f9f9f9" }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                  Example {index + 1}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "medium", mt: 1 }}>
                  Input:
                </Typography>
                <Typography
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#eee",
                    p: 1,
                    borderRadius: 1,
                    mt: 0.5,
                  }}
                >
                  {example.input}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "medium", mt: 1 }}>
                  Output:
                </Typography>
                <Typography
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#eee",
                    p: 1,
                    borderRadius: 1,
                    mt: 0.5,
                  }}
                >
                  {example.output}
                </Typography>
                {example.explanation && (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: "medium", mt: 1 }}>
                      Explanation:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                      {example.explanation}
                    </Typography>
                  </>
                )}
              </Paper>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          Submit Solution
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={3}>
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
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="java">Java</MenuItem>
                <MenuItem value="cpp">C++</MenuItem>
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
              InputProps={{ sx: { fontFamily: "monospace" } }} // Monospace font for code
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitCode}
              sx={{ mt: { xs: 2, sm: 0 } }}
            >
              Submit Code
            </Button>
          </Grid>
        </Grid>
        {submissionStatus && (
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: submissionStatus.includes("failed") ? "error.main" : "success.main",
            }}
          >
            {submissionStatus}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ProblemDetailPage;
