import React from "react";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

/**
 * Proptypes
 * @param {string} problem_id
 * @param {string} problem_name
 * @param {string} problem_difficulty
 * @param {object} sx
 */

const ProblemCard = (props) => {
  return (
    <Paper
      elevation={0}
      square
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        py: 1.5,
        borderBottom: "1px solid #eee",
        "&:last-child": {
          borderBottom: "none",
        },
        ...props.sx,
      }}
    >
      <Typography
        variant="body1"
        sx={{
          flexBasis: "15%",
          textAlign: "left",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          px: 1.5,
        }}
      >
        {props.problem_id}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          flexBasis: "60%",
          textAlign: "left",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          px: 1.5,
        }}
      >
        {props.problem_name}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          flexBasis: "25%",
          textAlign: "right",
          fontWeight: "bold",
          color:
            props.problem_difficulty === "hard"
              ? "red"
              : props.problem_difficulty === "medium"
              ? "orange"
              : "green",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          px: 1.5,
        }}
      >
        {props.problem_difficulty}
      </Typography>
    </Paper>
  );
};

export default ProblemCard;
