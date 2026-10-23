"""Small human-readable run summary; never includes source question text."""


def markdown(summary):
    lines = ["# TOEIC run report", "", f"Status: {summary['status']}",
             f"Artifact directory: `{summary['directory']}`", "",
             "| Stage | Status |", "|---|---|"]
    lines.extend(f"| {row['stage']} | {row['status']} |" for row in summary["stages"])
    lines.extend(["", f"AI attempts in this run (including resumed attempts): {summary['ai_calls']}",
                  "USD cost is unknown unless independently measured; missing provider usage is not zero cost.",
                  "Computational completion does not approve human review or confirm publication.", ""])
    return "\n".join(lines)
