// Scrape readable text from the body of the web page
(function () {
  // Grab raw text
  const rawText = document.body ? document.body.innerText : "";

  // Clean up excessive whitespace and consecutive blank lines
  const cleanText = rawText
    .replace(/[ \t]+/g, " ")                // Replace multiple spaces/tabs with a single space
    .replace(/([\r\n]){3,}/g, "\n\n")      // Replace 3+ consecutive newlines with 2 newlines
    .trim();

  // Return the cleaned text content
  return cleanText;
})();
