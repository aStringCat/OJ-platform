import { useState, useEffect } from "react";
import ProblemCard from "../modules/ProblemCard";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

const Problems = () => {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    const problem1 = {
      id: "2025A",
      name: "hello world, this is a very long problem name to test overflow",
      difficulty: "hard",
    };
    const problem2 = {
      id: "2025B",
      name: "reverse",
      difficulty: "hard",
    };
    const problem3 = {
      id: "2025C",
      name: "sklearn",
      difficulty: "hard",
    };
    const problem4 = {
      id: "2025D",
      name: "happy JML",
      difficulty: "medium",
    };
    const problem5 = {
      id: "2025E",
      name: "中文にほんごрусский язык😘😋",
      difficulty: "easy",
    };
    const hardcoded = [problem1, problem2, problem3, problem4, problem5];
    setProblems(hardcoded);
  }, []);

  const problemsList = problems.map((problem, index) => (
    <ProblemCard
      key={`ProblemCard_${problem.id}`}
      problem_id={problem.id}
      problem_name={problem.name}
      problem_difficulty={problem.difficulty}
      sx={{ backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9" }}
    />
  ));

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, width: "90%" }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Problem List
        </Typography>
      </Box>
      <Paper
        elevation={1}
        sx={{
          border: "1px solid #e0e0e0",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1.5,
            fontWeight: "bold",
            backgroundColor: "#f0f0f0",
            borderBottom: "1px solid #ddd",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              flexBasis: "15%",
              textAlign: "left",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1.5,
            }}
          >
            ID
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              flexBasis: "60%",
              textAlign: "left",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1.5,
            }}
          >
            Name
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              flexBasis: "25%",
              textAlign: "right",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1.5,
            }}
          >
            Difficulty
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>{problemsList}</Box>
      </Paper>
    </Container>
  );
};
export default Problems;
