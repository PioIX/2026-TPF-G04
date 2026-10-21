export default function Button({ text, type = "submit" }) {
  return (
    <button
      type={type}
      className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full"
    >
      {text}
    </button>
  );
}