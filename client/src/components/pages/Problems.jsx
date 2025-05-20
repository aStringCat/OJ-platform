import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProblemCard from "../modules/ProblemCard";
import { get } from "../../utilities";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    get("/api/problems")
      .then((data) => {
        setProblems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch problems:", err);
        setError("Failed to load problems. Please try again later.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography>Loading problems...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  const problemsList = problems.map((problem, index) => (
    <Link
      key={`ProblemLink_${problem.problem_id || problem._id}`}
      to={`/problem/${problem.problem_id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <ProblemCard
        problem_id={problem.problem_id}
        problem_name={problem.problem_name}
        problem_difficulty={problem.problem_difficulty}
        sx={{
          backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9",
          "&:hover": { backgroundColor: "#f0f0f0", cursor: "pointer" },
        }}
      />
    </Link>
  ));

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, width: "90%" }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Problem List
        </Typography>
      </Box>
      {problems.length === 0 && !loading ? (
        <Typography sx={{ textAlign: "center" }}>No problems available at the moment.</Typography>
      ) : (
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
                flexBasis: "20%",
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
                flexBasis: "55%",
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
      )}
    </Container>
  );
};
export default Problems;
