export const downloadReportAsWord = (
  content: string,
  filename: string = "ZWDS_Analysis_Report.docx",
) => {
  // Basic HTML wrapper for Word (MHTML/HTML approach compatible with Word)
  const preHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>ZWDS Report</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
        h1 { font-size: 18pt; color: #2e1065; border-bottom: 2px solid #2e1065; padding-bottom: 10px; margin-bottom: 20px; }
        h2 { font-size: 14pt; color: #4c1d95; margin-top: 20px; margin-bottom: 10px; font-weight: bold; }
        strong, b { color: #1e1b4b; font-weight: bold; }
        .list-item { margin-left: 20px; text-indent: -15px; margin-bottom: 5px; }
        .section-title { font-size: 12pt; font-weight: bold; margin-top: 15px; background-color: #f3f4f6; padding: 5px; }
        hr { border: 0; border-top: 1px solid #ccc; margin: 20px 0; }
        p { margin-bottom: 10px; }
      </style>
    </head>
    <body>
  `;
  const postHtml = "</body></html>";

  // 1. Content Cleaning (Escape HTML special chars to prevent breaking tags)
  let htmlContent = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Markdown to HTML transformations
  htmlContent = htmlContent
    // Main Title (ZWDS MAP...)
    .replace(/^ZWDS MAP (.*$)/gm, "<h1>ZWDS MAP $1</h1>")

    // Bold (**text**)
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")

    // Horizontal Rule (---)
    .replace(/^---$/gm, "<hr>")

    // List Items (* text)
    // We convert these to div with indentation to mimic lists without worrying about nested <ul>/<li> structure complexity in regex
    .replace(/^\* (.*$)/gm, "<div class='list-item'>• $1</div>")

    // Section Headers (e.g., 1. SELF (Diri))
    // Identifying lines that start with a bold number like "<b>1."
    .replace(/^(<b>\d+\..*?<\/b>.*$)/gm, "<div class='section-title'>$1</div>")

    // Line breaks - Convert newlines to <br>
    .replace(/\n/g, "<br>");

  const fullHtml = preHtml + htmlContent + postHtml;

  // 3. Create Blob and Trigger Download
  const blob = new Blob(["\ufeff", fullHtml], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
