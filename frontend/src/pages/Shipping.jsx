import React, { useState } from 'react';

const Shipping = () => {
  const [activeTab, setActiveTab] = useState('lbc');
  const [lbcKey, setLbcKey] = useState('');
  const [jtKey, setJtKey] = useState('');
  const [jrsKey, setJrsKey] = useState('');
  const [status, setStatus] = useState(null);

  // Placeholder for shipping history
  const shippingHistory = [
    // Example data
    // { id: 1, carrier: 'LBC', rate: 150, status: 'Active', date: '2024-06-01' },
  ];

  const handleLbcSubmit = (e) => {
    e.preventDefault();
    setStatus('LBC account setup saved.');
    // TODO: Integrate with backend
  };

  const handleJtSubmit = (e) => {
    e.preventDefault();
    setStatus('J&T Express account setup saved.');
    // TODO: Integrate with backend
  };

  const handleJrsSubmit = (e) => {
    e.preventDefault();
    setStatus('JRS Express account setup saved.');
    // TODO: Integrate with backend
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Philippine Shipping Setup</h1>
      <p className="text-gray-600 mb-6">Configure your shipping carrier accounts to manage shipping rates and delivery options.</p>
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-t-md font-semibold focus:outline-none ${activeTab === 'lbc' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('lbc')}
        >
          LBC
        </button>
        <button
          className={`px-4 py-2 rounded-t-md font-semibold focus:outline-none ${activeTab === 'jt' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('jt')}
        >
          J&T Express
        </button>
        <button
          className={`px-4 py-2 rounded-t-md font-semibold focus:outline-none ${activeTab === 'jrs' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('jrs')}
        >
          JRS Express
        </button>
      </div>
      <div className="bg-white shadow rounded-b-md p-6 mb-8">
        {activeTab === 'lbc' && (
          <form onSubmit={handleLbcSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">LBC API Key</label>
              <input
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={lbcKey}
                onChange={e => setLbcKey(e.target.value)}
                placeholder="Enter your LBC API key"
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save LBC Account</button>
          </form>
        )}
        {activeTab === 'jt' && (
          <form onSubmit={handleJtSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">J&T Express API Key</label>
              <input
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={jtKey}
                onChange={e => setJtKey(e.target.value)}
                placeholder="Enter your J&T Express API key"
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save J&T Express Account</button>
          </form>
        )}
        {activeTab === 'jrs' && (
          <form onSubmit={handleJrsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">JRS Express API Key</label>
              <input
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={jrsKey}
                onChange={e => setJrsKey(e.target.value)}
                placeholder="Enter your JRS Express API key"
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save JRS Express Account</button>
          </form>
        )}
      </div>
      {status && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-md">{status}</div>
      )}
      <div>
        <h2 className="text-xl font-semibold mb-2">Shipping History</h2>
        {shippingHistory.length === 0 ? (
          <p className="text-gray-500">No shipping records yet.</p>
        ) : (
          <table className="min-w-full bg-white border rounded-md">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Carrier</th>
                <th className="py-2 px-4 border-b">Rate</th>
                <th className="py-2 px-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {shippingHistory.map(record => (
                <tr key={record.id}>
                  <td className="py-2 px-4 border-b">{record.date}</td>
                  <td className="py-2 px-4 border-b">{record.carrier}</td>
                  <td className="py-2 px-4 border-b">{record.rate}</td>
                  <td className="py-2 px-4 border-b">{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Shipping; 