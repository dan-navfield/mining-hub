export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Test Page</h1>
      <p className="text-gray-600 mt-2">This is a simple test to see if the app is working.</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Card 1</h2>
          <p className="text-gray-600">Simple card content</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Card 2</h2>
          <p className="text-gray-600">Simple card content</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Card 3</h2>
          <p className="text-gray-600">Simple card content</p>
        </div>
      </div>
    </div>
  );
}
