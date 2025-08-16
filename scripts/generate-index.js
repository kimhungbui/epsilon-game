// scripts/generate-index.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Needed to replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chaptersDir = path.join(__dirname, "../public/chapters");
const indexFile = path.join(chaptersDir, "index.json");

const files = fs.readdirSync(chaptersDir);

const chapterFiles = files.filter(f => f.endsWith(".json") && f !== "index.json");

const chapters = chapterFiles.map(f => {
  const fullPath = path.join(chaptersDir, f);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  return { title: data.title, file: f };
});

fs.writeFileSync(indexFile, JSON.stringify(chapters, null, 2));
console.log("index.json generated successfully!");