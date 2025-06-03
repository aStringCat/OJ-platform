import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

/**
 * A reusable loading spinner component.
 *
 * @param {object} props
 * @param {string} [props.message="Loading..."] - Optional message to display below the spinner.
 * @param {boolean} [props.fullPage=true] - If true, centers the spinner on the page. Otherwise, it's more inline.
 * @param {number | string} [props.spinnerSize=40] - Size of the CircularProgress. If a number, unit is pixels. If a string, CSS unit is required (e.g., '3rem').
 * @param {object} [props.sx] - Custom styles for the container Box or Container.
 */
const LoadingSpinner = ({
  message = "Loading...",
  fullPage = true,
  spinnerSize = 40, // Default size is 40px
  sx,
}) => {
  const spinnerContent = (
    <>
      <CircularProgress size={spinnerSize} /> {/* Use spinnerSize prop */}
      {message &&
        message.length > 0 && ( // Only display Typography if message has content
          <Typography sx={{ mt: fullPage ? 2 : 1, color: "text.secondary" }}>{message}</Typography>
        )}
    </>
  );

  if (fullPage) {
    return (
      <Container
        maxWidth="xs"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh", // Adjust as needed for full page centering
          textAlign: "center",
          ...sx,
        }}
      >
        {spinnerContent}
      </Container>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 1, // Some padding for inline usage
        ...sx,
      }}
    >
      {spinnerContent}
    </Box>
  );
};

export default LoadingSpinner;
