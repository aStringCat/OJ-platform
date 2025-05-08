import React, { useState, useEffect } from "react";
import ProblemCard from "../modules/ProblemCard";
//import { get } from "../../utilities";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

const Problems = () => {
  const [problems, setProblems] = useState([]);

  /*
  useEffect(() => {
    document.title = "News Feed";
    get("/api/problems").then((problems) => {
      let reversedProblems = problems.reverse();
      setProblems(reversedProblems);
    });
  }, []);
  */

  useEffect(() => {
    const problem1 = {
      id: "2025A",
      name: "hello world",
      difficulty: "hard",
    };
    const problem2 = {
      id: "2025B",
      name: "reverse",
      difficulty: "hard",
    };
    const problem3 = {
      id: "2025C",
      name: "split",
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

  const problemsList = problems.map((problem) => (
    <Grid item key={`ProblemCard_${problem.id}`} xs={12} sm={6} md={4} lg={3}>
      <ProblemCard
        problem_id={problem.id}
        problem_name={problem.name}
        problem_difficulty={problem.difficulty}
      />
    </Grid>
  ));

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Problem List
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {problemsList}
      </Grid>
    </Container>
  );
};
export default Problems;
