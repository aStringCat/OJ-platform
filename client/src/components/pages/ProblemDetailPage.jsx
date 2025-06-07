import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, post } from "../../utilities";
import BackButton from "../modules/BackButton";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const ProblemDetailPage = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [language, setLanguage] = useState("python");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  const allowedFileTypes = [".py", ".java", ".cpp", ".c", ".txt"];
  const acceptedFileTypesString = allowedFileTypes.join(",");

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

  const processAndSetFile = (file) => {
    if (file) {
      const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedFileTypes.includes(fileExtension)) {
        setSubmissionStatus(
          `Invalid file type: "${fileExtension}". Allowed types: ${allowedFileTypes.join(", ")}`
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSubmissionStatus(`File is too large. Maximum size is 5MB.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFile(file);
      setSubmissionStatus("");
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      processAndSetFile(event.target.files[0]);
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleSubmitCode = async () => {
    if (!selectedFile) {
      setSubmissionStatus("Please select a code file to submit.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionStatus("Submitting...");
    const formData = new FormData();
    formData.append("language", language);
    formData.append("codeFile", selectedFile);
    try {
      const response = await post(`/api/submit/${problemId}`, formData);
      navigate(`/submission/${response.submissionId}`);
    } catch (err) {
      console.error("Submission failed:", err);
      const errorMsg = err.data?.msg || err.message || "Submission failed. Please try again.";
      setSubmissionStatus(errorMsg);
      setIsSubmitting(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsDraggingOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processAndSetFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, position: "relative" }}>
        <BackButton sx={{ top: { xs: 16, sm: 24 }, left: { xs: 16, sm: 24 } }} />
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

        {problem.examples && problem.examples.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Examples
            </Typography>
            {problem.examples.map((example, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{ p: 2, mb: 2, backgroundColor: "grey.100" }}
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
                    wordBreak: "break-all",
                    backgroundColor: "grey.200",
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
        <Typography variant="h5" component="h2" gutterBottom>
          Submit Solution
        </Typography>
        <Grid container spacing={2}>
          <Grid>
            <Box
              component="label"
              htmlFor="code-file-input"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: isDraggingOver ? "2px dashed primary.main" : "2px dashed grey.500",
                borderRadius: 1,
                p: { xs: 2, sm: 4 },
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: isDraggingOver ? "action.hover" : "transparent",
                transition: "border-color 0.3s, background-color 0.3s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "220px",
              }}
            >
              <input
                id="code-file-input"
                ref={fileInputRef}
                type="file"
                hidden
                onChange={handleFileChange}
                accept={acceptedFileTypesString}
              />
              <CloudUploadIcon
                sx={{ fontSize: 48, mb: 1, color: isDraggingOver ? "primary.main" : "grey.600" }}
              />
              <Typography
                variant="h6"
                sx={{ color: isDraggingOver ? "primary.main" : "text.primary" }}
              >
                Drag & drop your code file here
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                or click to select a file
              </Typography>
              {selectedFile ? (
                <Typography
                  variant="body2"
                  sx={{ mt: 2, color: "primary.main", fontWeight: "bold" }}
                >
                  Selected: {selectedFile.name}
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 1 }}>
                  Allowed types: {allowedFileTypes.join(", ")}. Max 5MB.
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmitCode}
                disabled={!selectedFile || isSubmitting}
                sx={{ minHeight: "56px" }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Submit Code"}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {submissionStatus && (
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              textAlign: "center",
              color:
                submissionStatus.toLowerCase().includes("failed") ||
                submissionStatus.toLowerCase().includes("invalid") ||
                submissionStatus.toLowerCase().includes("select a") ||
                submissionStatus.toLowerCase().includes("too large")
                  ? "error.main"
                  : "success.main",
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
