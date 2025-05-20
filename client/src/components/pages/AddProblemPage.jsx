import { useState } from "react";
import { post } from "../../utilities";
import BackButton from "../modules/BackButton";

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

const AddProblemPage = () => {
  const [problemData, setProblemData] = useState({
    problem_id: "",
    problem_name: "",
    problem_difficulty: "easy",
    content: "",
    examples: [{ input: "", output: "", explanation: "" }],
  });
  const [loading, setLoading] = useState(false);
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
    const updatedExamples = [...problemData.examples];
    updatedExamples.splice(index, 1);
    setProblemData((prevData) => ({
      ...prevData,
      examples: updatedExamples,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!problemData.problem_id || !problemData.problem_name || !problemData.content) {
      setError("Problem ID, Name, and Content are required.");
      setLoading(false);
      return;
    }

    post("/api/problem", problemData)
      .then((response) => {
        setLoading(false);
        setSuccess(`Problem "${response.problem_name}" added successfully!`);
        setProblemData({
          problem_id: "",
          problem_name: "",
          problem_difficulty: "easy",
          content: "",
          examples: [{ input: "", output: "", explanation: "" }],
        });
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || "Failed to add problem. Please check console for details.");
        console.error("Failed to add problem:", err);
      });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, position: "relative" }}>
      <BackButton />
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold", textAlign: "center" }}
        >
          Add New Problem
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="problem_id"
                label="Problem ID"
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
          <Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Examples
              </Typography>
              {problemData.examples.map((example, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, position: "relative" }}>
                  <IconButton
                    aria-label="delete example"
                    onClick={() => removeExample(index)}
                    sx={{ position: "absolute", top: 8, right: 8 }}
                    disabled={problemData.examples.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <TextField
                    margin="dense"
                    fullWidth
                    label={`Example ${index + 1} - Input`}
                    name="input"
                    multiline
                    rows={2}
                    value={example.input}
                    onChange={(e) => handleExampleChange(index, e)}
                  />
                  <TextField
                    margin="dense"
                    fullWidth
                    label={`Example ${index + 1} - Output`}
                    name="output"
                    multiline
                    rows={2}
                    value={example.output}
                    onChange={(e) => handleExampleChange(index, e)}
                  />
                  <TextField
                    margin="dense"
                    fullWidth
                    label={`Example ${index + 1} - Explanation (Optional)`}
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
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" sx={{ mt: 2, textAlign: "center" }}>
              {success}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Problem"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddProblemPage;
