export default function Input({ label, type = "text", placeholder, value, onChange, required = false }) {
  return (
    <div className="flex flex-col mb-3">
      {label && <label className="mb-1 font-medium">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required} // <-- Agregamos esto aquí
        className="border p-2 rounded"
      />
    </div>
  );
}