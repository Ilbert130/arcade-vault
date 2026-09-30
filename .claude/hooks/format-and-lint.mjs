// PostToolUse hook: on the file Claude just wrote or edited, runs Prettier
// (any file), ESLint --fix (JS/TS files) and then strips blank lines from code
// files (JS/TS/CSS) so the code stays compact. Blank lines inside template
// literals are preserved because they are part of the string value.
// Unfixable ESLint errors exit 2 so Claude sees them and fixes them.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
// Git Bash on Windows may hand us POSIX-style paths like /c/Users/...
const fromMsys = (p) =>
  process.platform === "win32" ? p.replace(/^\/([a-zA-Z])(?=\/|$)/, "$1:") : p;
const projectDir = path.resolve(
  fromMsys(process.env.CLAUDE_PROJECT_DIR || process.cwd()),
);
const PRETTIER = path.join(
  projectDir,
  "node_modules/prettier/bin/prettier.cjs",
);
const ESLINT = path.join(projectDir, "node_modules/eslint/bin/eslint.js");
const LINTABLE = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const COMPACTABLE = new Set([...LINTABLE, ".css"]);
const SKIP_DIRS = ["node_modules", ".next", ".git"];
let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const rawPath = input?.tool_input?.file_path ?? input?.tool_response?.filePath;
if (!rawPath) process.exit(0);
const file = path.resolve(projectDir, fromMsys(rawPath));
const rel = path.relative(projectDir, file);
if (!existsSync(file) || rel.startsWith("..") || path.isAbsolute(rel))
  process.exit(0);
if (rel.split(path.sep).some((seg) => SKIP_DIRS.includes(seg))) process.exit(0);
const ext = path.extname(file).toLowerCase();
const run = (script, args) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd: projectDir,
    encoding: "utf8",
  });
// Returns [start, end) ranges of template literals, where blank lines matter.
const templateRanges = (source) => {
  let ts;
  try {
    ts = createRequire(path.join(projectDir, "package.json"))("typescript");
  } catch {
    return null;
  }
  const kind =
    ext === ".tsx" || ext === ".jsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const ranges = [];
  const visit = (node) => {
    if (ts.isTemplateLiteral(node))
      ranges.push([node.getStart(sf), node.getEnd()]);
    else ts.forEachChild(node, visit);
  };
  visit(sf);
  return ranges;
};
const stripBlankLines = () => {
  const source = readFileSync(file, "utf8");
  const ranges = ext === ".css" ? [] : templateRanges(source);
  if (!ranges) return;
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  const kept = [];
  let offset = 0;
  for (const [i, line] of lines.entries()) {
    const inTemplate = ranges.some(([s, e]) => offset > s && offset < e);
    const isLast = i === lines.length - 1;
    if (line.trim() !== "" || inTemplate || isLast) kept.push(line);
    offset +=
      line.length + (source.startsWith("\r\n", offset + line.length) ? 2 : 1);
  }
  const result = kept.join(eol);
  if (result !== source) writeFileSync(file, result);
};
if (existsSync(PRETTIER)) {
  run(PRETTIER, ["--write", "--ignore-unknown", "--log-level", "warn", file]);
}
let eslintFailure = null;
if (LINTABLE.has(ext) && existsSync(ESLINT)) {
  const result = run(ESLINT, ["--fix", "--no-warn-ignored", file]);
  if (result.status === 1) eslintFailure = `${result.stdout}${result.stderr}`;
}
if (COMPACTABLE.has(ext)) stripBlankLines();
if (eslintFailure) {
  process.stderr.write(
    `ESLint encontró errores que no pudo corregir en ${rel}:\n${eslintFailure}`,
  );
  process.exit(2);
}
process.exit(0);
