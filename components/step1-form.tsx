import React, { useState } from "react";

interface Step1FormProps {
  onResults: (results: any) => void;
}

const Step1Form: React.FC<Step1FormProps> = ({ onResults }) => {
  const [formData, setFormData] = useState({
    imprint: "",
    shape: "",
    color: "",
    scored: false,
    size: "",
    dosageForm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const results = await response.json();
      onResults(results);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="imprint" className="block text-sm font-medium">
          Imprint
        </label>
        <input
          type="text"
          id="imprint"
          name="imprint"
          value={formData.imprint}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="shape" className="block text-sm font-medium">
          Shape
        </label>
        <select
          id="shape"
          name="shape"
          value={formData.shape}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        >
          <option value="">Select shape</option>
          <option value="round">Round</option>
          <option value="oval">Oval</option>
          <option value="capsule">Capsule</option>
        </select>
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium">
          Color
        </label>
        <select
          id="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        >
          <option value="">Select color</option>
          <option value="white">White</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
        </select>
      </div>

      <div>
        <label htmlFor="scored" className="block text-sm font-medium">
          Scored
        </label>
        <input
          type="checkbox"
          id="scored"
          name="scored"
          checked={formData.scored}
          onChange={handleChange}
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="size" className="block text-sm font-medium">
          Size (optional)
        </label>
        <input
          type="text"
          id="size"
          name="size"
          value={formData.size}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="dosageForm" className="block text-sm font-medium">
          Dosage Form (optional)
        </label>
        <input
          type="text"
          id="dosageForm"
          name="dosageForm"
          value={formData.dosageForm}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <button
        type="submit"
        className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  );
};

export default Step1Form;
