import { useState } from "react";
import { post } from "../../utilities";
import BackButton from "../modules/BackButton";
import { useAuth } from "../../auth";
import { Navigate, useLocation } from "react-router-dom";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import LoadingSpinner from "../modules/LoadingSpinner";

const AddProblemPage = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const initialProblemData = {
    problem_id: "",
    problem_name: "",
    problem_difficulty: "easy",
    content: "",
    examples: [{ input: "", output: "", explanation: "" }],
    cases: [{ input: "", output: "" }], // Renamed from testCases
  };

  const [problemData, setProblemData] = useState(initialProblemData);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProblemData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleExampleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedExamples = [...problemData.examples];
    updatedExamples[index][name] = value;
    setProblemData((prevData) => ({
      ...prevData,
      examples: updatedExamples,
    }));
  };

  const handleCaseChange = (index, e) => {
    // Renamed from handleTestCaseChange
    const { name, value } = e.target;
    const updatedCases = [...problemData.cases]; // Renamed from updatedTestCases
    updatedCases[index][name] = value;
    setProblemData((prevData) => ({
      ...prevData,
      cases: updatedCases, // Renamed from testCases
    }));
  };

  const addExample = () => {
    setProblemData((prevData) => ({
      ...prevData,
      examples: [...prevData.examples, { input: "", output: "", explanation: "" }],
    }));
  };

  const removeExample = (index) => {
    const updatedExamples = [...problemData.examples];
    updatedExamples.splice(index, 1);
    setProblemData((prevData) => ({
      ...prevData,
      examples: updatedExamples,
    }));
  };

  const addCase = () => {
    // Renamed from addTestCase
    setProblemData((prevData) => ({
      ...prevData,
      cases: [...prevData.cases, { input: "", output: "" }], // Renamed from testCases
    }));
  };

  const removeCase = (index) => {
    // Renamed from removeTestCase
    if (problemData.cases.length <= 1) {
      // Renamed from testCases
      setError("At least one case is required."); // Updated message
      return;
    }
    const updatedCases = [...problemData.cases]; // Renamed from updatedTestCases
    updatedCases.splice(index, 1);
    setProblemData((prevData) => ({ ...prevData, cases: updatedCases })); // Renamed from testCases
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    if (
      !problemData.problem_id.trim() ||
      !problemData.problem_name.trim() ||
      !problemData.content.trim()
    ) {
      setError("Problem ID, Name, and Content are required.");
      setSubmitLoading(false);
      return;
    }

    // Validate Cases
    if (
      !problemData.cases ||
      problemData.cases.length === 0 ||
      problemData.cases.some((c) => !c.input?.trim() || !c.output?.trim())
    ) {
      // Renamed from testCases
      setError("At least one case with non-empty input and output is required."); // Updated message
      setSubmitLoading(false);
      return;
    }

    const examplesToSubmit = problemData.examples.filter(
      (ex) => ex.input?.trim() || ex.output?.trim() || ex.explanation?.trim()
    );

    if (examplesToSubmit.some((ex) => !ex.input?.trim() || !ex.output?.trim())) {
      setError("If an example is partially filled, its input and output fields are required.");
      setSubmitLoading(false);
      return;
    }

    const dataToSubmit = {
      ...problemData,
      examples: examplesToSubmit,
    };

    post("/api/problem", dataToSubmit)
      .then((response) => {
        setSubmitLoading(false);
        setSuccess(
          `Problem "${response.problem_name || problemData.problem_name}" (ID: ${
            response.problem_id || problemData.problem_id
          }) added successfully!`
        );
        setProblemData(initialProblemData);
      })
      .catch((err) => {
        setSubmitLoading(false);
        const errorMsg = err.data?.msg || err.message || "Failed to add problem.";
        setError(errorMsg);
        console.error("Failed to add problem:", err);
      });
  };

  if (authLoading) {
    return <LoadingSpinner fullPage={true} message="Checking authentication..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, mb: 4 }}>
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
          Add New Problem
        </Typography>
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            {success}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {/* Problem ID, Name, Difficulty, Content */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="problem_id"
                label="Problem ID (e.g., P1001)"
                name="problem_id"
                value={problemData.problem_id}
                onChange={handleChange}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="problem_name"
                label="Problem Name"
                name="problem_name"
                value={problemData.problem_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="difficulty-label">Difficulty</InputLabel>
                <Select
                  labelId="difficulty-label"
                  id="problem_difficulty"
                  name="problem_difficulty"
                  value={problemData.problem_difficulty}
                  label="Difficulty"
                  onChange={handleChange}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="content"
                label="Problem Content/Description (Markdown supported)"
                name="content"
                multiline
                rows={6}
                value={problemData.content}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          {/* Examples Section */}
          <Box sx={{ my: 3, borderTop: "1px solid #ddd", pt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Examples (Publicly Visible - Optional)
            </Typography>
            {problemData.examples.map((example, index) => (
              <Paper
                key={`example-${index}`}
                variant="outlined"
                sx={{ p: 2, mb: 2, position: "relative" }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Example {index + 1}
                </Typography>
                <IconButton
                  aria-label="delete example"
                  onClick={() => removeExample(index)}
                  sx={{ position: "absolute", top: 8, right: 8 }}
                >
                  <DeleteIcon />
                </IconButton>
                <TextField
                  margin="dense"
                  fullWidth
                  label={`Input`}
                  name="input"
                  multiline
                  rows={2}
                  value={example.input}
                  onChange={(e) => handleExampleChange(index, e)}
                />
                <TextField
                  margin="dense"
                  fullWidth
                  label={`Output`}
                  name="output"
                  multiline
                  rows={2}
                  value={example.output}
                  onChange={(e) => handleExampleChange(index, e)}
                />
                <TextField
                  margin="dense"
                  fullWidth
                  label={`Explanation (Optional)`}
                  name="explanation"
                  multiline
                  rows={1}
                  value={example.explanation}
                  onChange={(e) => handleExampleChange(index, e)}
                />
              </Paper>
            ))}
            <Button onClick={addExample} variant="outlined" sx={{ mt: 1 }}>
              Add Example
            </Button>
          </Box>

          {/* Cases Section */}
          <Box sx={{ my: 3, borderTop: "1px solid #ddd", pt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Cases (Not Publicly Visible - Required)
            </Typography>
            {problemData.cases.map(
              (
                problemCase,
                index // Renamed testCase to problemCase to avoid conflict with map variable
              ) => (
                <Paper
                  key={`case-${index}`}
                  variant="outlined"
                  sx={{ p: 2, mb: 2, position: "relative" }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    Case {index + 1}
                  </Typography>
                  {problemData.cases.length > 1 && (
                    <IconButton
                      aria-label="delete case"
                      onClick={() => removeCase(index)} // Renamed from removeTestCase
                      sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <TextField
                    margin="dense"
                    fullWidth
                    required
                    label={`Input`}
                    name="input"
                    multiline
                    rows={2}
                    value={problemCase.input}
                    onChange={(e) => handleCaseChange(index, e)} // Renamed from handleTestCaseChange
                  />
                  <TextField
                    margin="dense"
                    fullWidth
                    required
                    label={`Output`}
                    name="output"
                    multiline
                    rows={2}
                    value={problemCase.output}
                    onChange={(e) => handleCaseChange(index, e)} // Renamed from handleTestCaseChange
                  />
                </Paper>
              )
            )}
            <Button onClick={addCase} variant="outlined" sx={{ mt: 1 }}>
              {" "}
              {/* Renamed from addTestCase */}
              Add Case
            </Button>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : "Add Problem"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
export default AddProblemPage;
