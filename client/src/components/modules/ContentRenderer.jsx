import Typography from "@mui/material/Typography";
import CodeBlock from "./CodeBlock";

const ContentRenderer = ({ content }) => {
  if (!content) {
    return <Typography color="text.secondary">No description provided.</Typography>;
  }

  const sections = content.split(/```([\w+-]*)\n([\s\S]*?)```/g);
  return sections.map((section, index) => {
    if (index % 3 === 2) {
      return (
        <CodeBlock key={index} language={sections[index - 1]}>
          {section.replace(/\n$/, "")}
        </CodeBlock>
      );
    }
    if (index % 3 === 1 || !section) return null;
    return (
      <Typography key={index} component="div" variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
        {section}
      </Typography>
    );
  });
};

export default ContentRenderer;
