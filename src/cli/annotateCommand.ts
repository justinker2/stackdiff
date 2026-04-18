import { loadHistory } from "../diff/diffHistory";
import { annotateDiff, countBySeverity } from "../diff/diffAnnotate";
import { formatAnnotationReport } from "../output/annotationFormatter";

export interface AnnotateArgs {
  limit: number;
  minSeverity: "info" | "warning" | "error";
}

const SEVERITY_RANK = { info: 0, warning: 1, error: 2 };

export function parseAnnotateArgs(argv: string[]): AnnotateArgs {
  let limit = 20;
  let minSeverity: AnnotateArgs["minSeverity"] = "info";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) limit = parseInt(argv[++i], 10);
    if (argv[i] === "--min-severity" && argv[i + 1]) {
      const val = argv[++i];
      if (val === "info" || val === "warning" || val === "error") minSeverity = val;
    }
  }

  return { limit, minSeverity };
}

export async function runAnnotateCommand(argv: string[]): Promise<void> {
  const args = parseAnnotateArgs(argv);
  const history = await loadHistory();
  const recent = history.slice(-args.limit);

  if (recent.length === 0) {
    console.log("No diff history found.");
    return;
  }

  const annotations = annotateDiff(recent).filter(
    (a) => SEVERITY_RANK[a.severity] >= SEVERITY_RANK[args.minSeverity]
  );

  console.log(formatAnnotationReport(annotations));

  const counts = countBySeverity(annotations);
  if (counts.error > 0) process.exitCode = 1;
}
