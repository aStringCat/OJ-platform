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

const AddProblemPage = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const initialProblemData = {
    problem_id: "",
    problem_name: "",
    problem_difficulty: "easy",
    content: "",
    examples: [{ input: "", output: "", explanation: "" }], // Start with one example field
    cases: [{ input: "", output: "" }], // Start with one case field, as it's required
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
    const { name, value } = e.target;
    const updatedCases = [...problemData.cases];
    updatedCases[index][name] = value;
    setProblemData((prevData) => ({
      ...prevData,
      cases: updatedCases,
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
    setProblemData((prevData) => ({
      ...prevData,
      cases: [...prevData.cases, { input: "", output: "" }],
    }));
  };

  const removeCase = (index) => {
    if (problemData.cases.length <= 1) {
      setError("At least one test case is required.");
      return;
    }
    const updatedCases = [...problemData.cases];
    updatedCases.splice(index, 1);
    setProblemData((prevData) => ({ ...prevData, cases: updatedCases }));
    setError(""); // Clear error if successfully removed a case (and more than one remains)
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    // Validate core problem data
    if (
      !problemData.problem_id.trim() ||
      !problemData.problem_name.trim() ||
      !problemData.content.trim()
    ) {
      setError("Problem ID, Name, and Content are required.");
      setSubmitLoading(false);
      return;
    }

    // Filter out completely empty examples and validate partially filled ones
    const examplesToSubmit = problemData.examples.filter(
      (ex) => ex.input?.trim() || ex.output?.trim() || ex.explanation?.trim()
    );

    if (examplesToSubmit.some((ex) => !ex.input?.trim() || !ex.output?.trim())) {
      setError("If an example is partially filled, its input and output fields are required.");
      setSubmitLoading(false);
      return;
    }

    // Validate Test Cases: At least one case with non-empty input and output is required.
    if (
      !problemData.cases ||
      problemData.cases.length === 0 ||
      problemData.cases.some((c) => !c.input?.trim() || !c.output?.trim())
    ) {
      setError("At least one test case with non-empty input and output is required.");
      setSubmitLoading(false);
      return;
    }

    const dataToSubmit = {
      ...problemData,
      problem_id: problemData.problem_id.trim(),
      problem_name: problemData.problem_name.trim(),
      content: problemData.content.trim(),
      examples: examplesToSubmit.map((ex) => ({
        // Trim fields of examples to be submitted
        input: ex.input.trim(),
        output: ex.output.trim(),
        explanation: ex.explanation?.trim() || "", // Ensure explanation is a string
      })),
      cases: problemData.cases.map((c) => ({
        // Trim fields of cases
        input: c.input.trim(),
        output: c.output.trim(),
      })),
    };

    post("/api/problem", dataToSubmit)
      .then((response) => {
        setSubmitLoading(false);
        setSuccess(
          `Problem "${response.problem_name || dataToSubmit.problem_name}" (ID: ${
            response.problem_id || dataToSubmit.problem_id
          }) added successfully!`
        );
        setProblemData(initialProblemData); // Reset form to initial state
      })
      .catch((err) => {
        setSubmitLoading(false);
        const errorMsg = err.data?.msg || err.message || "Failed to add problem.";
        setError(errorMsg);
        console.error("Failed to add problem:", err);
      });
  };

  if (authLoading) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography>Checking authentication...</Typography>
      </Container>
    );
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
          }} /* Padding top to avoid overlap with back button */
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
          <Grid container spacing={2}>
            <Grid>
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
            <Grid>
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
            <Grid>
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
          </Grid>
          <Grid>
            <Grid>
              <TextField
                margin="normal"
                required
                fullWidth
                id="content"
                label="Problem Content/Description"
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
              Test Cases (Not Publicly Visible - At least one required)
            </Typography>
            {problemData.cases.map((problemCase, index) => (
              <Paper
                key={`case-${index}`}
                variant="outlined"
                sx={{ p: 2, mb: 2, position: "relative" }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Test Case {index + 1}
                </Typography>
                {problemData.cases.length > 1 && ( // Only show delete if more than one case
                  <IconButton
                    aria-label="delete case"
                    onClick={() => removeCase(index)}
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
                  onChange={(e) => handleCaseChange(index, e)}
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
                  onChange={(e) => handleCaseChange(index, e)}
                />
              </Paper>
            ))}
            <Button onClick={addCase} variant="outlined" sx={{ mt: 1 }}>
              Add Test Case
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
