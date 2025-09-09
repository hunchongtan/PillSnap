import React, { useState } from "react";

interface Step2FormProps {
  onSubmit: (formData: {
    suspectedName: string;
    manufacturer: string;
    strength: string;
    indication: string;
    country: string;
    notes: string;
  }) => void;
}

const Step2Form: React.FC<Step2FormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    suspectedName: "",
    manufacturer: "",
    strength: "",
    indication: "",
    country: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="suspectedName" className="block text-sm font-medium">
          Suspected Name (Generic/Brand)
        </label>
        <input
          type="text"
          id="suspectedName"
          name="suspectedName"
          value={formData.suspectedName}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="manufacturer" className="block text-sm font-medium">
          Manufacturer
        </label>
        <input
          type="text"
          id="manufacturer"
          name="manufacturer"
          value={formData.manufacturer}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="strength" className="block text-sm font-medium">
          Strength
        </label>
        <input
          type="text"
          id="strength"
          name="strength"
          value={formData.strength}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="indication" className="block text-sm font-medium">
          Indication/Condition
        </label>
        <input
          type="text"
          id="indication"
          name="indication"
          value={formData.indication}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium">
          Country/Market
        </label>
        <input
          type="text"
          id="country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        ></textarea>
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

export default Step2Form;
