import React, { JSX } from "react";
import { FieldType, ValueField } from "../types";

interface PivotProps {
  data: any[];
  rows: string[];
  columns: string[];
  values: ValueField[];
  fieldTypes: Record<string, FieldType>;
}

const aggregators: Record<string, (arr: any[]) => number> = {
  Sum: (arr) => arr.reduce((a, b) => a + b, 0),
  Average: (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
  Min: (arr) => Math.min(...arr),
  Max: (arr) => Math.max(...arr),
  Count: (arr) => arr.length,
};

interface TreeNode {
  name: string;
  key: string;
  level: number;
  children: TreeNode[];
  values: Record<string, Record<string, number[]>>;
}

const PivotTable: React.FC<PivotProps> = ({
  data,
  rows,
  columns,
  values,
  fieldTypes,
}) => {
  const getColKeys = () => {
    const keys = new Set<string>();
    data.forEach((row) => {
      const colKey = columns.map((c) => row[c]).join("|||");
      keys.add(colKey);
    });
    return Array.from(keys).sort();
  };
  const colKeys = getColKeys();

  const buildTree = (): TreeNode[] => {
    const rootNodes: TreeNode[] = [];
    const map = new Map<string, TreeNode>();

    for (const row of data) {
      let currentLevelNodes = rootNodes;
      let pathKey = "";

      for (let i = 0; i < rows.length; i++) {
        const fieldName = rows[i];
        const value = row[fieldName];
        const key = pathKey ? `${pathKey}|||${value}` : String(value);

        let node = map.get(key);
        if (!node) {
          node = {
            name: String(value),
            key: key,
            level: i,
            children: [],
            values: {},
          };
          currentLevelNodes.push(node);
          map.set(key, node);
        }

        const colKey = columns.map((c) => row[c]).join("|||");

        for (const { field } of values) {
          const val =
            fieldTypes[field] === "number" ? Number(row[field]) : row[field];
          if (!node.values[field]) node.values[field] = {};
          if (!node.values[field][colKey]) node.values[field][colKey] = [];
          node.values[field][colKey].push(val);
        }

        currentLevelNodes = node.children;
        pathKey = key;
      }
    }

    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(rootNodes);

    return rootNodes;
  };

  const rowTree = buildTree();

  const getAggregatedValue = (
    rawValues: any[] | undefined,
    aggregation: string,
  ) => {
    if (!rawValues || rawValues.length === 0) return 0; // Or null?
    return aggregators[aggregation](
      rawValues.filter((v) => typeof v === "number" || aggregation === "Count"),
    );
  };

  const buildHeaderTree = () => {
    const tree: any = {};
    for (const colKey of colKeys) {
      const parts = colKey.split("|||");
      let current = tree;
      for (const part of parts) {
        if (!part) continue;
        current[part] = current[part] || {};
        current = current[part];
      }
    }
    return tree;
  };

  const renderHeaderRows = (
    node: any,
    _depth: number,
    maxDepth: number,
  ): JSX.Element[][] => {
    const rows: JSX.Element[][] = Array.from({ length: maxDepth }, () => []);
    const fillRows = (
      node: any,
      level: number,
      colSpanCalc: () => number,
      parentKey = "",
    ): number => {
      let totalColSpan = 0;
      for (const key of Object.keys(node)) {
        const subTree = node[key];
        const fullKey = parentKey ? `${parentKey}|||${key}` : key;
        const colSpan = Object.keys(subTree).length
          ? fillRows(subTree, level + 1, colSpanCalc, fullKey)
          : values.reduce((acc, v) => acc + v.aggregations.length, 0);

        rows[level].push(
          <th
            key={fullKey}
            colSpan={colSpan}
            rowSpan={Object.keys(subTree).length ? 1 : maxDepth - level}
          >
            {key}
          </th>,
        );
        totalColSpan += colSpan;
      }
      return totalColSpan;
    };
    fillRows(node, 0, () =>
      values.reduce((acc, v) => acc + v.aggregations.length, 0),
    );
    return rows;
  };

  const renderHeader = () => {
    const tree = buildHeaderTree();
    const maxDepth = columns.length;
    const headerRows = maxDepth > 0 ? renderHeaderRows(tree, 0, maxDepth) : [];

    return (
      <thead>
        {headerRows.map((row, i) => (
          <tr key={`header-row-${i}`} className="col-header">
            {i === 0 && (
              <th
                rowSpan={headerRows.length + 1}
                style={{ textAlign: "left", minWidth: "200px" }}
              >
                Row Labels
              </th>
            )}
            {row}
            {i === 0 &&
              values.flatMap(({ field, aggregations }) =>
                aggregations.map((agg) => (
                  <th
                    key={`total-${field}-${agg}`}
                    rowSpan={headerRows.length + 1}
                  >
                    Total {field} ({agg})
                  </th>
                )),
              )}
          </tr>
        ))}

        {maxDepth === 0 && (
          <tr className="col-header">
            <th style={{ textAlign: "left", minWidth: "200px" }}>Row Labels</th>
            {values.flatMap(({ field, aggregations }) =>
              aggregations.map((agg) => (
                <th key={`total-${field}-${agg}`}>
                  Total {field} ({agg})
                </th>
              )),
            )}
          </tr>
        )}

        {maxDepth > 0 && (
          <tr>
            {colKeys.flatMap((colKey) =>
              values.flatMap(({ field, aggregations }) =>
                aggregations.map((agg) => (
                  <th className="agg-header" key={`${colKey}-${field}-${agg}`}>
                    {field} ({agg})
                  </th>
                )),
              ),
            )}
          </tr>
        )}
      </thead>
    );
  };

  const renderRows = (nodes: TreeNode[]): JSX.Element[] => {
    let rendered: JSX.Element[] = [];

    for (const node of nodes) {
      const rowAggTotals: Record<string, number> = {};

      rendered.push(
        <tr key={node.key}>
          <td
            style={{
              paddingLeft: `${node.level * 20 + 10}px`,
              textAlign: "left",
            }}
          >
            {node.children.length > 0 ? (
              <strong>{node.name}</strong>
            ) : (
              node.name
            )}
          </td>

          {colKeys.flatMap((colKey) =>
            values.flatMap(({ field, aggregations }) =>
              aggregations.map((agg) => {
                const rawVals = node.values[field]?.[colKey];
                const val = getAggregatedValue(rawVals, agg);

                const key = `${field}-${agg}`;
                rowAggTotals[key] =
                  (rowAggTotals[key] || 0) + (Number.isFinite(val) ? val : 0);

                return (
                  <td key={`${node.key}-${colKey}-${field}-${agg}`}>
                    {Number.isFinite(val) && val !== 0 ? val.toFixed(2) : ""}
                  </td>
                );
              }),
            ),
          )}

          {values.flatMap(({ field, aggregations }) =>
            aggregations.map((agg) => {
              const key = `${field}-${agg}`;
              const val = rowAggTotals[key];
              return (
                <td
                  key={`row-total-${node.key}-${key}`}
                  style={{ fontWeight: "bold" }}
                >
                  {val !== 0 ? val.toFixed(2) : ""}
                </td>
              );
            }),
          )}
        </tr>,
      );

      if (node.children.length > 0) {
        rendered = rendered.concat(renderRows(node.children));
      }
    }
    return rendered;
  };

  const renderGrandTotal = () => {
    const colAggTotals: Record<string, number> = {};

    return (
      <tr>
        <td>
          <strong>Grand Total</strong>
        </td>

        {colKeys.flatMap((colKey) =>
          values.flatMap(({ field, aggregations }) =>
            aggregations.map((agg) => {
              const key = `${field}-${agg}`;

              const totalValues: any[] = [];
              for (const row of data) {
                const rowColKey = columns.map((c) => row[c]).join("|||");
                if (rowColKey === colKey) {
                  totalValues.push(
                    fieldTypes[field] === "number"
                      ? Number(row[field])
                      : row[field],
                  );
                }
              }

              const val = getAggregatedValue(totalValues, agg);
              colAggTotals[key] =
                (colAggTotals[key] || 0) + (Number.isFinite(val) ? val : 0);

              return (
                <td key={`grand-${colKey}-${field}-${agg}`}>
                  <strong>
                    {Number.isFinite(val) && val !== 0 ? val.toFixed(2) : ""}
                  </strong>
                </td>
              );
            }),
          ),
        )}

        {values.flatMap(({ field, aggregations }) =>
          aggregations.map((agg) => {
            const key = `${field}-${agg}`;
            const val = colAggTotals[key];
            return (
              <td key={`grand-total-${key}`}>
                <strong>{val !== 0 ? val.toFixed(2) : ""}</strong>
              </td>
            );
          }),
        )}
      </tr>
    );
  };

  return (
    <table
      border={1}
      cellPadding={5}
      style={{
        background: "#fff",
        borderCollapse: "collapse",
        width: "100%",
        fontFamily: "sans-serif",
      }}
    >
      {renderHeader()}
      <tbody>
        {renderRows(rowTree)}
        {renderGrandTotal()}
      </tbody>
    </table>
  );
};

export default PivotTable;
