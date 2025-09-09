import React from "react";

interface PillResult {
  id: number;
  generic_name: string;
  brand_name: string;
  strength: string;
  dosage_form: string;
  imprint_norm: string;
  shape: string;
  color: string;
  scored: boolean;
  image_url: string;
  matchPercentage: number;
}

interface ResultsGridProps {
  results: PillResult[];
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ results }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {results.map((pill) => (
        <div
          key={pill.id}
          className="border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <img
            src={pill.image_url}
            alt={pill.generic_name || pill.brand_name}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
          <h3 className="text-lg font-semibold">
            {pill.generic_name || pill.brand_name}
          </h3>
          <p className="text-sm text-gray-600">Strength: {pill.strength}</p>
          <p className="text-sm text-gray-600">Dosage Form: {pill.dosage_form}</p>
          <p className="text-sm text-gray-600">Imprint: {pill.imprint_norm}</p>
          <p className="text-sm text-gray-600">Shape: {pill.shape}</p>
          <p className="text-sm text-gray-600">Color: {pill.color}</p>
          <p className="text-sm text-gray-600">Scored: {pill.scored ? "Yes" : "No"}</p>
          <p className="text-sm text-blue-500 font-medium">
            Match Percentage: {pill.matchPercentage.toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
};

export default ResultsGrid;
