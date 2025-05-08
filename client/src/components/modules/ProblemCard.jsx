import React from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

/**
 * Proptypes
 * @param {string} problem_id
 * @param {string} problem_name
 * @param {string} problem_difficulty
 */

const ProblemCard = (props) => {
  return (
    <Card sx={{ mb: 2, minWidth: 275, border: "1px solid #e0e0e0" }} elevation={1}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {props.problem_name}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 14 }} color="text.secondary">
            {props.problem_id}
          </Typography>
          <Typography variant="body2" sx={{ color: "green", fontWeight: "bold" }}>
            {props.problem_difficulty}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProblemCard;
