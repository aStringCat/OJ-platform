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

  const [problemData, setProblemData] = useState({
    problem_id: "",
    problem_name: "",
    problem_difficulty: "easy",
    content: "",
    examples: [{ input: "", output: "", explanation: "" }],
  });
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

  const addExample = () => {
    setProblemData((prevData) => ({
      ...prevData,
      examples: [...prevData.examples, { input: "", output: "", explanation: "" }],
    }));
  };

  const removeExample = (index) => {
    if (problemData.examples.length <= 1) return;
    const updatedExamples = [...problemData.examples];
    updatedExamples.splice(index, 1);
    setProblemData((prevData) => ({
      ...prevData,
      examples: updatedExamples,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");
    setSuccess("");

    if (!problemData.problem_id || !problemData.problem_name || !problemData.content) {
      setError("Problem ID, Name, and Content are required.");
      setSubmitLoading(false);
      return;
    }
    if (problemData.examples.some((ex) => !ex.input || !ex.output)) {
      setError("All examples must have an input and an output.");
      setSubmitLoading(false);
      return;
    }

    post("/api/problem", problemData)
      .then((response) => {
        setSubmitLoading(false);
        setSuccess(
          `Problem "${response.problem_name}" (ID: ${response.problem_id}) added successfully!`
        );
        setProblemData({
          problem_id: "",
          problem_name: "",
          problem_difficulty: "easy",
          content: "",
          examples: [{ input: "", output: "", explanation: "" }],
        });
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
      <Container
        sx={{
          textAlign: "center",
          mt: 5,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
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
          </Grid>
          <Grid>
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
          <Box sx={{ my: 2 }}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Examples
            </Typography>
            {problemData.examples.map((example, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, position: "relative" }}>
                <Typography variant="subtitle1" gutterBottom>
                  Example {index + 1}
                </Typography>
                {problemData.examples.length > 1 && (
                  <IconButton
                    aria-label="delete example"
                    onClick={() => removeExample(index)}
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
                  value={example.input}
                  onChange={(e) => handleExampleChange(index, e)}
                />
                <TextField
                  margin="dense"
                  fullWidth
                  required
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
              Add Another Example
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
