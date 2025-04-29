import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import PivotTable from "./components/PivotTable";
import { FieldType, ValueField } from "./types";
import 'boxicons'

import 'boxicons/css/boxicons.min.css';

const App: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [fieldTypes, setFieldTypes] = useState<Record<string, FieldType>>({});
  const [rows, setRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [values, setValues] = useState<ValueField[]>([]);
  const [fileName, setFileName] = useState<any>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [file]: any = e.target.files;
    if (!file) return;
    setFileName(file.name)
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split("\n").filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim());
        const rowsData = lines.slice(1).map((line) =>
          line.split(",").reduce((acc, val, idx) => {
            acc[headers[idx]] = val.trim();
            return acc;
          }, {} as Record<string, string>)
        );

        const types: Record<string, FieldType> = {};
        for (const field of headers) {
          const sample = rowsData[0]?.[field];
          types[field] = !isNaN(Number(sample)) ? "number" : "string";
        }

        // ✅ Reset everything
        setRows([]);
        setColumns([]);
        setValues([]);
        setFields(headers);
        setData(rowsData);
        setFieldTypes(types);
      } catch (error) {
        console.error("Failed to parse file:", error);
      }
    };

    reader.readAsText(file);
  };


  return (
    <div className="main-container">
      <div className="pivot-table">
        <h1>Pivot Table</h1>


        <div className="mx-auto overflow-hidden my-3 w-full inline-block">
          <div className="md:flex w-full flex justify-center">
            <div className="w-fit p-3">
              <div
                className="relative h-30 rounded-lg border-2 border-blue-500 bg-gray-50 flex justify-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out gap-1.5">
                <div className="absolute flex flex-col items-center">
                  <img alt="File Icon" className="mb-3" src="https://img.icons8.com/dusk/64/csv.png" />
                  <span className="block text-gray-500 font-semibold">Drag &amp; drop your files here</span>
                  <span className="block text-gray-400 font-normal mt-1">or click to upload</span>
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="h-full w-full opacity-0 cursor-pointer" />
              </div>
              {
                fileName &&
                <div>
                  <div className="file-name">{fileName}</div>
                </div>

              }
            </div>
          </div>
        </div>



        {/* <input type="file" accept=".csv" onChange={handleFileUpload} /> */}



        {data.length > 0 && (
          <PivotTable
            data={data}
            rows={rows}
            columns={columns}
            values={values}
            fieldTypes={fieldTypes}
          />
        )}
      </div>
      <Sidebar
        fields={fields}
        rows={rows}
        columns={columns}
        values={values}
        setRows={setRows}
        setColumns={setColumns}
        setValues={setValues}
        fieldTypes={fieldTypes}
      />

      {data.length > 0 &&
        <div className="print"><button className="print-btn" onClick={() => { window.print() }}><i className='bx bxs-printer'></i> Print</button></div>
      }
    </div>
  );
};

export default App;
