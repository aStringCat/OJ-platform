import React, { useState, useEffect } from "react";
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
      name: "split string problem with multiple words",
      difficulty: "hard",
    };
    const problem4 = {
      id: "2025D",
      name: "happy JML",
      difficulty: "medium",
    };
    const problem5 = {
      id: "2025E",
      name: "yet or no",
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
      sx={{
        backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9",
      }}
    />
  ));

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Problem List
        </Typography>
      </Box>
      <Paper
        elevation={1}
        sx={{
          border: "1px solid #e0e0e0",
          overflow: "hidden" /* Ensure Paper itself handles overflow if needed */,
        }}
      >
        {/* Header Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1.5, // Match ProblemCard's row vertical padding
            fontWeight: "bold",
            backgroundColor: "#f0f0f0",
            borderBottom: "1px solid #ddd",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              flexBasis: "15%", // Match ProblemCard cell
              textAlign: "left",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1.5, // Match ProblemCard cell padding
            }}
          >
            ID
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              flexBasis: "60%", // Match ProblemCard cell
              textAlign: "left",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1.5, // Match ProblemCard cell padding
            }}
          >
            Name
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              flexBasis: "25%", // Match ProblemCard cell
              textAlign: "right",
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              px: 1.5, // Match ProblemCard cell padding
            }}
          >
            Difficulty
          </Typography>
        </Box>
        {/* List of Problems */}
        <Box sx={{ display: "flex", flexDirection: "column" }}>{problemsList}</Box>
      </Paper>
    </Container>
  );
};
export default Problems;
