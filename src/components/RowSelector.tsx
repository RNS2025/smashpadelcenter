import React from "react";
import Row from "../types/Row";
import LoadingSpinner from "./misc/LoadingSpinner.tsx";

type RowSelectorProps = {
  rows: Row[];
  selectedRowId: string | null;
  loading: boolean;
  onSelect: (rowId: string) => void;
};

const RowSelector: React.FC<RowSelectorProps> = ({
  rows,
  selectedRowId,
  loading,
  onSelect,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Vælg række</h2>
      {loading ? (
        <div className="flex items-center text-gray-500">
          <LoadingSpinner />
          Indlæser rækker...
        </div>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">Rækker ikke tilgængelige for denne turnering.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rows.map((row) => (
            <button
              key={row.Id}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedRowId === row.Id.toString()
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
              onClick={() => onSelect(row.Id.toString())}
            >
              {row.Name || `Row ${row.Id}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RowSelector;
