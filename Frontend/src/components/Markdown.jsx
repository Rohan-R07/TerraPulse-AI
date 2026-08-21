import React from "react";

export function Markdown({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];

  const parseInline = (text) => {
    if (!text) return "";
    
    // Split by bold (**text**)
    const boldParts = text.split("**");
    return boldParts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      
      // Split by italic (*text*)
      const italicParts = part.split("*");
      return italicParts.map((iPart, iIndex) => {
        if (iIndex % 2 === 1) {
          return <em key={`${index}-${iIndex}`}>{iPart}</em>;
        }
        return iPart;
      });
    });
  };

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} style={{ marginLeft: 20, marginBottom: 12, listStyleType: "disc" }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 6, fontSize: "inherit", lineHeight: 1.5 }}>
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      let headers = [];
      let rows = [];
      
      // If second row is a separator line (e.g. |---|---|)
      if (
        tableRows.length > 1 && 
        tableRows[1].some(cell => cell.trim().startsWith("---") || cell.trim().startsWith(":---"))
      ) {
        headers = tableRows[0];
        rows = tableRows.slice(2);
      } else {
        rows = tableRows;
      }

      elements.push(
        <div key={`table-container-${key}`} style={{ overflowX: "auto", margin: "14px 0", border: "2.5px solid #111827", borderRadius: 10, background: "#ffffff" }}>
          <table className="tp-table" style={{ margin: 0, width: "100%", borderCollapse: "collapse" }}>
            {headers.length > 0 && (
              <thead>
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} style={{ padding: "10px 14px", background: "var(--tp-neutral-100)", textAlign: "left", fontWeight: 800, borderBottom: "2.5px solid #111827" }}>
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((r, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: rIdx < rows.length - 1 ? "1.5px solid var(--tp-neutral-200)" : "none" }}>
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: "10px 14px", fontSize: "0.85rem" }}>
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Table processing
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList(i);
      inTable = true;
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable(i);
    }

    // List processing
    const listMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    const numListMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (listMatch) {
      inList = true;
      listItems.push(listMatch[2]);
      continue;
    } else if (numListMatch) {
      inList = true;
      listItems.push(numListMatch[2]);
      continue;
    } else {
      flushList(i);
    }

    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`br-${i}`} style={{ height: 6 }} />);
      continue;
    }

    // Headers
    if (trimmed.startsWith("###")) {
      elements.push(
        <h4 key={i} style={{ marginTop: 14, marginBottom: 6, color: "var(--tp-neutral-900)", fontWeight: 800, fontSize: "0.95rem" }}>
          {parseInline(trimmed.replace(/^###\s*/, ""))}
        </h4>
      );
    } else if (trimmed.startsWith("##")) {
      elements.push(
        <h3 key={i} style={{ marginTop: 18, marginBottom: 8, color: "var(--tp-neutral-900)", fontWeight: 800, fontSize: "1.1rem" }}>
          {parseInline(trimmed.replace(/^##\s*/, ""))}
        </h3>
      );
    } else if (trimmed.startsWith("#")) {
      elements.push(
        <h2 key={i} style={{ marginTop: 22, marginBottom: 10, color: "var(--tp-neutral-900)", fontWeight: 800, fontSize: "1.25rem" }}>
          {parseInline(trimmed.replace(/^#\s*/, ""))}
        </h2>
      );
    } else if (trimmed === "---") {
      elements.push(<hr key={i} style={{ margin: "16px 0", border: "none", borderTop: "2px dashed var(--tp-neutral-200)" }} />);
    } else {
      elements.push(
        <p key={i} style={{ marginBottom: 8, lineHeight: 1.5, color: "inherit", fontSize: "inherit" }}>
          {parseInline(line)}
        </p>
      );
    }
  }

  // Final flush
  flushList(lines.length);
  flushTable(lines.length);

  return <div className="tp-markdown-wrapper" style={{ fontSize: "inherit", color: "inherit" }}>{elements}</div>;
}
