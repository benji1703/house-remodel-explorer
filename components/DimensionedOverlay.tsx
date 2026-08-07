"use client";

import Image from "next/image";
import { useState } from "react";
import { geometryApprovalItems } from "@/data/house";

type OverlayMode = "measured" | "vector" | "compare";

export function DimensionedOverlay() {
  const [mode, setMode] = useState<OverlayMode>("compare");
  const [opacity, setOpacity] = useState(50);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const approvalByCategory = geometryApprovalItems.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + (item.approved ? 0 : 1);
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalUnresolved = geometryApprovalItems.filter((i) => !i.approved).length;

  return (
    <div className="dimensioned-overlay-container">
      <div className="overlay-comparison">
        <div className="comparison-controls">
          <div className="mode-selector">
            <button
              className={mode === "measured" ? "is-active" : ""}
              onClick={() => setMode("measured")}
              title="Show measured plan photograph only"
            >
              Measured
            </button>
            <button
              className={mode === "vector" ? "is-active" : ""}
              onClick={() => setMode("vector")}
              title="Show vector trace only"
            >
              Vector
            </button>
            <button
              className={mode === "compare" ? "is-active" : ""}
              onClick={() => setMode("compare")}
              title="Compare with opacity control"
            >
              Compare
            </button>
          </div>
          {mode === "compare" && (
            <div className="opacity-control">
              <label htmlFor="overlay-opacity">Transparency:</label>
              <input
                id="overlay-opacity"
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                aria-label="Adjust overlay transparency"
              />
              <span>{opacity}%</span>
            </div>
          )}
        </div>

        <div className="comparison-stage">
          {mode === "measured" && (
            <div className="measured-view">
              <Image
                src="/references/measured-plan.jpeg"
                alt="Original handwritten measured floor plan"
                fill
                sizes="100vw"
                unoptimized
                priority
              />
            </div>
          )}

          {(mode === "vector" || mode === "compare") && (
            <svg className="vector-plan" viewBox="-90 -100 1320 1410" role="img" aria-label="Measured floor plan audit">
              <defs>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(43,48,40,.08)" strokeWidth="2" />
                </pattern>
              </defs>
              <rect x="-90" y="-100" width="1320" height="1410" fill="url(#grid)" />
              <path className="plan-shell" d="M340 0H760V500H1140V1210H0V820H340Z" />
              <g className="dimension-line top-dimension">
                <line x1="0" y1="-45" x2="1140" y2="-45" />
                <line x1="0" y1="-65" x2="0" y2="-25" />
                <line x1="1140" y1="-65" x2="1140" y2="-25" />
                <text x="570" y="-60">1140 cm maximum width</text>
              </g>
              <g className="dimension-line side-dimension">
                <line x1="1185" y1="0" x2="1185" y2="1210" />
                <line x1="1165" y1="0" x2="1205" y2="0" />
                <line x1="1165" y1="1210" x2="1205" y2="1210" />
                <text x="1205" y="605" transform="rotate(90 1205 605)">1210 cm maximum depth</text>
              </g>
            </svg>
          )}

          {mode === "compare" && (
            <div className="overlay-image" style={{ opacity: opacity / 100 }}>
              <Image
                src="/references/measured-plan.jpeg"
                alt="Measured plan overlay"
                fill
                sizes="100vw"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>

      <div className="approval-checklist">
        <div className="checklist-header">
          <h3>Geometry Approval Checklist</h3>
          <span className="unresolved-count" title={`${totalUnresolved} items need approval`}>
            {totalUnresolved} unresolved
          </span>
        </div>

        <div className="checklist-categories">
          {Object.entries(approvalByCategory).map(([category, count]) => (
            <div key={category} className="category-group">
              <button
                className={`category-header ${expandedCategory === category ? "is-expanded" : ""}`}
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                aria-expanded={expandedCategory === category}
              >
                <span className="category-name">
                  {category.replace(/-/g, " ").charAt(0).toUpperCase() + category.replace(/-/g, " ").slice(1)}
                </span>
                {count > 0 && <span className="unresolved-badge">{count}</span>}
              </button>

              {expandedCategory === category && (
                <div className="category-items">
                  {geometryApprovalItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <div key={item.id} className={`approval-item ${item.approved ? "is-approved" : ""}`}>
                        <label>
                          <input
                            type="checkbox"
                            checked={item.approved}
                            onChange={(e) => {
                              // In production, this would update to persistent storage
                              console.log(`Toggled ${item.id}: ${e.target.checked}`);
                            }}
                            aria-label={item.description}
                          />
                          <span className="item-text">
                            <strong>{item.description}</strong>
                            {item.zone && <em> ({item.zone})</em>}
                            {item.notes && <p className="item-notes">{item.notes}</p>}
                          </span>
                        </label>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
