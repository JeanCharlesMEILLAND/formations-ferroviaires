const fs = require("fs");
const path = "C:/Users/jcmei/.claude/projects/C--Users-jcmei-OneDrive-Bureau-FIF/630460f5-78ee-4aca-b979-08badc8fbb96/tool-results/bhwi8ndxw.txt";
const raw = fs.readFileSync(path, "utf-8");

const idx = raw.lastIndexOf("Now I have comprehensive data");
if (idx > -1) {
  // Find closing quote - look for ","type" pattern
  let end = raw.indexOf('","type"', idx);
  if (end === -1) end = idx + 10000;
  let text = raw.substring(idx, end);
  // Unescape JSON string escapes
  text = text.replace(/\\n/g, "\n");
  text = text.replace(/\\t/g, "\t");
  text = text.replace(/\\\\/g, "\\");
  text = text.replace(/\\"/g, '"');
  text = text.replace(/\\\|/g, "|");
  text = text.replace(/\\\*/g, "*");
  console.log(text);
} else {
  console.log("Report not found");
}
