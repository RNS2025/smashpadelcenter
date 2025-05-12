import React from "react";
import Row from "../../../types/Row.ts";
import LoadingSpinner from "../../misc/LoadingSpinner.tsx";

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
        <div className="flex">
          <select
              className="border-slate-800/80 bg-slate-800/80 rounded-md p-2 text-gray-300 max-sm:w-full max-sm:text-sm truncate pr-8"
              value={selectedRowId || ""}
              onChange={(e) => onSelect(e.target.value)}>
            <option value="" disabled>
              Vælg række
            </option>
            {rows.map((row) => (
                <option key={row.Id} value={row.Id} className="text-gray-300 max-sm:text-xs max-sm:truncate max-sm:pr-2">
                  {row.Name}
                </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default RowSelector;
