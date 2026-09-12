import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const CodeBlock = ({ children, language = "", maxHeight = "600px" }) => {
  return (
    <Box sx={{ position: "relative", my: 1.5 }}>
      {language && (
        <Typography
          variant="caption"
          sx={{ position: "absolute", top: 8, right: 12, color: "grey.400" }}
        >
          {language}
        </Typography>
      )}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          pr: language ? 8 : 2,
          maxHeight,
          overflow: "auto",
          borderRadius: 1,
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          fontFamily: "monospace",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        <code>{children}</code>
      </Box>
    </Box>
  );
};

export default CodeBlock;
