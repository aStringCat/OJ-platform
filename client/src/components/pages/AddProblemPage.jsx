import { useState } from "react";
import { post } from "../../utilities";
import BackButton from "../modules/BackButton";
import CodeBlock from "../modules/CodeBlock";
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
import checkerExample from "../../../../examples/checkers/unordered-integers.py?raw";

const createInitialProblemData = () => ({
  problem_id: "",
  problem_name: "",
  problem_difficulty: "easy",
  content: "",
  judgeMode: "python",
  checkerCode: checkerExample,
  examples: [{ input: "", output: "", explanation: "" }],
  cases: [{ input: "", output: "" }],
});

const AddProblemPage = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const [problemData, setProblemData] = useState(createInitialProblemData);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkerChecking, setCheckerChecking] = useState(false);
  const [checkerValidation, setCheckerValidation] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "checkerCode" || name === "judgeMode") {
      setCheckerValidation(null);
    }
    setProblemData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateChecker = async () => {
    if (!problemData.checkerCode.trim()) {
      setCheckerValidation({ valid: false, message: "Please provide a Python checker script." });
      return false;
    }

    setCheckerChecking(true);
    setCheckerValidation(null);
    try {
      const result = await post("/api/checker/validate", {
        checkerCode: problemData.checkerCode,
      });
      setCheckerValidation(result);
      return true;
    } catch (err) {
      setCheckerValidation({
        valid: false,
        message: err.data?.message || err.data?.msg || err.message || "Checker validation failed.",
      });
      return false;
    } finally {
      setCheckerChecking(false);
    }
  };

  const handleExampleChange = (index, e) => {
    const { name, value } = e.target;
    setProblemData((prevData) => ({
      ...prevData,
      examples: prevData.examples.map((example, exampleIndex) =>
        exampleIndex === index ? { ...example, [name]: value } : example
      ),
    }));
  };

  const handleCaseChange = (index, e) => {
    const { name, value } = e.target;
    setProblemData((prevData) => ({
      ...prevData,
      cases: prevData.cases.map((problemCase, caseIndex) =>
        caseIndex === index ? { ...problemCase, [name]: value } : problemCase
      ),
    }));
  };

  const addExample = () => {
    setProblemData((prevData) => ({
      ...prevData,
      examples: [...prevData.examples, { input: "", output: "", explanation: "" }],
    }));
  };

  const removeExample = (index) => {
    setProblemData((prevData) => ({
      ...prevData,
      examples: prevData.examples.filter((_, exampleIndex) => exampleIndex !== index),
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
    setProblemData((prevData) => ({
      ...prevData,
      cases: prevData.cases.filter((_, caseIndex) => caseIndex !== index),
    }));
    setError(""); // Clear error if successfully removed a case (and more than one remains)
  };

  const handleSubmit = async (e) => {
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

    if (examplesToSubmit.some((ex) => !ex.output?.trim())) {
      setError("If an example is filled, its output field is required.");
      setSubmitLoading(false);
      return;
    }

    // Empty input is valid for problems that do not read from standard input.
    if (!problemData.cases || problemData.cases.length === 0) {
      setError("At least one test case is required. Input and output may be empty.");
      setSubmitLoading(false);
      return;
    }

    if (problemData.judgeMode === "python" && !problemData.checkerCode.trim()) {
      setError("Please provide a Python checker script.");
      setSubmitLoading(false);
      return;
    }

    if (problemData.judgeMode === "python" && !(await validateChecker())) {
      setError("Please fix the Python checker before adding the problem.");
      setSubmitLoading(false);
      return;
    }

    const dataToSubmit = {
      ...problemData,
      problem_id: problemData.problem_id.trim(),
      problem_name: problemData.problem_name.trim(),
      content: problemData.content.trim(),
      examples: examplesToSubmit.map((ex) => ({
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation?.trim() || "",
      })),
      // Test data is whitespace-sensitive, so preserve it exactly as entered.
      cases: problemData.cases.map((c) => ({ input: c.input, output: c.output })),
    };

    post("/api/problem", dataToSubmit)
      .then((response) => {
        setSubmitLoading(false);
        setSuccess(
          `Problem "${response.problem_name || dataToSubmit.problem_name}" (ID: ${
            response.problem_id || dataToSubmit.problem_id
          }) added successfully!`
        );
        setProblemData(createInitialProblemData());
        setCheckerValidation(null);
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
                helperText={"Use fenced code blocks such as ```python ... ``` to render code."}
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
              Answer Judging
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="judge-mode-label">Judge Mode</InputLabel>
              <Select
                labelId="judge-mode-label"
                name="judgeMode"
                label="Judge Mode"
                value={problemData.judgeMode}
                onChange={handleChange}
              >
                <MenuItem value="standard">Standard output comparison</MenuItem>
                <MenuItem value="python">Python checker</MenuItem>
              </Select>
            </FormControl>
            {problemData.judgeMode === "python" && (
              <>
                <Alert severity="info" sx={{ my: 1 }}>
                  Define check(input_data, expected_output, actual_output). Return True when the
                  contestant output is correct and False when it is wrong. The function runs in a
                  separate container with a 2-second limit. Maximum script size: 64KB.
                </Alert>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  <Button
                    onClick={() => {
                      setProblemData((previous) => ({
                        ...previous,
                        checkerCode: checkerExample,
                      }));
                      setCheckerValidation(null);
                    }}
                  >
                    Reset Demo
                  </Button>
                  <Button variant="outlined" onClick={validateChecker} disabled={checkerChecking}>
                    {checkerChecking ? <CircularProgress size={20} /> : "Check Script"}
                  </Button>
                </Box>
                {checkerValidation && (
                  <Alert severity={checkerValidation.valid ? "success" : "error"} sx={{ mb: 2 }}>
                    {checkerValidation.message}
                  </Alert>
                )}
                <TextField
                  label="Python Checker"
                  name="checkerCode"
                  fullWidth
                  multiline
                  minRows={12}
                  value={problemData.checkerCode}
                  onChange={handleChange}
                  slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
                />
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Code Preview
                </Typography>
                <CodeBlock language="python" maxHeight="360px">
                  {problemData.checkerCode}
                </CodeBlock>
              </>
            )}
          </Box>
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
