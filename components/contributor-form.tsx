import React, { useState } from "react";

interface ContributorFormProps {
  onSubmit: (formData: {
    generic_name: string;
    brand_name: string;
    strength: string;
    dosage_form: string;
    imprint_raw: string;
    imprint_norm: string;
    shape: string;
    color: string;
    scored: boolean;
    image_url: File | null;
    image_url_back: File | null;
    manufacturer: string;
  }) => void;
}

const ContributorForm: React.FC<ContributorFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    generic_name: "",
    brand_name: "",
    strength: "",
    dosage_form: "",
    imprint_raw: "",
    imprint_norm: "",
    shape: "",
    color: "",
    scored: false,
    image_url: null,
    image_url_back: null,
    manufacturer: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : null,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="generic_name" className="block text-sm font-medium">
          Generic Name
        </label>
        <input
          type="text"
          id="generic_name"
          name="generic_name"
          value={formData.generic_name}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="brand_name" className="block text-sm font-medium">
          Brand Name
        </label>
        <input
          type="text"
          id="brand_name"
          name="brand_name"
          value={formData.brand_name}
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
        <label htmlFor="dosage_form" className="block text-sm font-medium">
          Dosage Form
        </label>
        <input
          type="text"
          id="dosage_form"
          name="dosage_form"
          value={formData.dosage_form}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="imprint_raw" className="block text-sm font-medium">
          Imprint (Raw)
        </label>
        <input
          type="text"
          id="imprint_raw"
          name="imprint_raw"
          value={formData.imprint_raw}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="imprint_norm" className="block text-sm font-medium">
          Imprint (Normalized)
        </label>
        <input
          type="text"
          id="imprint_norm"
          name="imprint_norm"
          value={formData.imprint_norm}
          onChange={handleChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
        <label htmlFor="image_url" className="block text-sm font-medium">
          Front Image
        </label>
        <input
          type="file"
          id="image_url"
          name="image_url"
          onChange={handleFileChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <label htmlFor="image_url_back" className="block text-sm font-medium">
          Back Image
        </label>
        <input
          type="file"
          id="image_url_back"
          name="image_url_back"
          onChange={handleFileChange}
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

      <button
        type="submit"
        className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  );
};

export default ContributorForm;
