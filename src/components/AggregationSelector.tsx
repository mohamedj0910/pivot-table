import React from "react";
import "./AggregationSelector.css";

interface AggregationSelectorProps {
  type: "string" | "number";
  selected: string[];
  onChange: (selected: string[]) => void;
}

const AGGREGATIONS: Record<"string" | "number", string[]> = {
  number: ["Sum", "Average", "Min", "Max", "Count"],
  string: ["Count"],
};

const AggregationSelector: React.FC<AggregationSelectorProps> = ({ type, selected, onChange }) => {
  const toggle = (agg: string) => {
    if (selected.includes(agg)) {
      onChange(selected.filter((a) => a !== agg));
    } else {
      onChange([...selected, agg]);
    }
  };

  return (
    <div className="aggregation-selector">
      {AGGREGATIONS[type].map((agg) => (
        <span
          key={agg}
          className={`badge ${selected.includes(agg) ? "selected" : ""}`}
          onClick={() => toggle(agg)}
        >
          {agg}
        </span>
      ))}
    </div>
  );
};

export default AggregationSelector;
