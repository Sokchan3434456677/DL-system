import React, { useState, useEffect } from 'react';
import './userDriver.css';

const IceOrderForm = ({ initialData = null, onClose, onUpdateSuccess }) => {
  // State to manage form inputs
  const [customerName, setCustomerName] = useState('');
  const [iceOrders, setIceOrders] = useState({
    originalIce: Array(4).fill({ quantity: '', price: '' }),
    largeHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
    largeHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
    smallHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
    smallHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
  });

  // These states will now be directly editable for new users, and will display current values for existing.
  const [newDebt, setNewDebt] = useState(''); // Renamed from currentNewDebt for clarity
  const [payment, setPayment] = useState(''); // Renamed from currentPayment for clarity
  const [expenses, setExpenses] = useState(''); // Renamed from currentExpenses for clarity

  // States for the amounts to be added/subtracted (only relevant for existing customers)
  const [addDebtAmount, setAddDebtAmount] = useState('');
  const [addPaymentAmount, setAddPaymentAmount] = useState('');

  const [popupIceType, setPopupIceType] = useState(null); // Track which popup is open
  const [loading, setLoading] = useState(false); // To show loading state
  const [error, setError] = useState(null); // To handle errors
  const [success, setSuccess] = useState(false); // To show success message

  // Effect to pre-populate form when initialData is provided (for editing)
  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName || '');

      const populatedIceOrders = {};
      for (const type in initialData.iceOrders) {
        const filteredOrders = initialData.iceOrders[type].filter(item => item.quantity !== 0 || item.price !== 0);
        populatedIceOrders[type] = [
          ...filteredOrders.map(item => ({
            quantity: item.quantity !== undefined ? item.quantity.toString() : '',
            price: item.price !== undefined ? item.price.toString() : '',
          })),
          ...Array(Math.max(0, 4 - filteredOrders.length)).fill({ quantity: '', price: '' }),
        ];
      }
      setIceOrders(populatedIceOrders);

      // Set current values for display and potential updates
      setNewDebt(initialData.newDebt !== undefined ? initialData.newDebt.toString() : '0');
      setPayment(initialData.payment !== undefined ? initialData.payment.toString() : '0');
      setExpenses(initialData.expenses !== undefined ? initialData.expenses.toString() : '0');

      // Clear the "add" input fields when an existing customer is loaded for editing
      setAddDebtAmount('');
      setAddPaymentAmount('');

    } else {
      // Clear form for new entry
      clearForm();
    }
  }, [initialData]);

  // Handle changes for ice order inputs
  const handleIceOrderChange = (iceType, index, field, value) => {
    const updatedIceOrders = { ...iceOrders };
    updatedIceOrders[iceType][index] = {
      ...updatedIceOrders[iceType][index],
      [field]: value,
    };
    setIceOrders(updatedIceOrders);
  };

  // Helper function to process ice order data before sending
  const processIceOrderData = (orders) => {
    const processedOrders = {};
    for (const type in orders) {
      processedOrders[type] = orders[type]
        .filter(item => item.quantity !== '' || item.price !== '')
        .map(item => ({
          quantity: item.quantity === '' ? 0 : Number(item.quantity),
          price: item.price === '' ? 0 : Number(item.price),
        }));
    }
    return processedOrders;
  };

  // Handle form submission for ice orders and other fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const processedIceOrders = processIceOrderData(iceOrders);

    let updatedNewDebt = Number(newDebt) || 0;
    let updatedPayment = Number(payment) || 0;

    // If editing, add the additional debt/payment amounts
    if (initialData) {
      if (addDebtAmount) {
        updatedNewDebt += Number(addDebtAmount) || 0;
      }
      if (addPaymentAmount) {
        updatedPayment += Number(addPaymentAmount) || 0;
      }
    }

    const orderData = {
      customerName,
      iceOrders: processedIceOrders,
      newDebt: updatedNewDebt,
      payment: updatedPayment,
      expenses: Number(expenses) || 0,
    };

    const url = initialData ? `https://dl-api-v-01.vercel.app/api/orders/${initialData._id}` : 'https://dl-api-v-01.vercel.app/api/orders';
    const method = initialData ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${initialData ? 'update' : 'save'} customer data.`);
      }

      const data = await response.json();
      setSuccess(true);
      if (initialData) {
        onUpdateSuccess(data);
        setAddDebtAmount('');
        setAddPaymentAmount('');
      } else {
        clearForm();
        // Reload page to show new data
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Clear all form fields
  const clearForm = () => {
    setCustomerName('');
    setIceOrders({
      originalIce: Array(4).fill({ quantity: '', price: '' }),
      largeHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
      largeHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
      smallHygiene20kg: Array(4).fill({ quantity: '', price: '' }),
      smallHygiene30kg: Array(4).fill({ quantity: '', price: '' }),
    });
    setNewDebt(''); // Clear for new entry
    setPayment(''); // Clear for new entry
    setExpenses('');
    setAddDebtAmount(''); // Clear add debt field
    setAddPaymentAmount(''); // Clear add payment field
    setPopupIceType(null); // Close any open popup
    setError(null); // Clear errors
    setSuccess(false); // Clear success message
  };

  // Popup close handler (click overlay or close button)
  const handlePopupClose = () => setPopupIceType(null);

  // Helper function to render ice input rows (for popup)
  const renderIceInputs = (iceType, label, isPopup = false) => (
    <div className={isPopup ? "" : "mb-4 p-4 border rounded-md shadow-sm"}>
      <h3 className={`font-semibold text-lg mb-2`}>{label}</h3>
      {iceOrders[iceType].map((order, index) => (
        <div key={index} className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <label htmlFor={`${iceType}-quantity-${index}`}>ចំណួន (Quantity)</label>
            <input
              type="number"
              id={`${iceType}-quantity-${index}`}
              value={order.quantity}
              onChange={(e) =>
                handleIceOrderChange(iceType, index, 'quantity', e.target.value)
              }
            />
          </div>
          <div>
            <label htmlFor={`${iceType}-price-${index}`}>តម្លៃ (Price)</label>
            <input
              type="number"
              id={`${iceType}-price-${index}`}
              value={order.price}
              onChange={(e) =>
                handleIceOrderChange(iceType, index, 'price', e.target.value)
              }
            />
          </div>
        </div>
      ))}
      {isPopup && (
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => {
              setIceOrders((prev) => ({
                ...prev,
                [iceType]: Array(4).fill({ quantity: '', price: '' }),
              }));
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handlePopupClose}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {initialData ? 'កែសម្រួលព័ត៌មានអតិថិជន (Edit Customer Info)' : 'បន្ថែមអតិថិជនថ្មី (Add New Customer)'}
      </h1>
      <form onSubmit={handleSubmit}>
        {/* Customer Name */}
        <div className="mb-4">
          <label htmlFor="customerName">គោត្តនាម (Customer Name)</label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>

        {/* Ice Type Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">ប្រភេទទឹកកក (Ice Type)</h2>
          <div className="grid gap-4">
            <button type="button" className="font-semibold text-left border rounded-md p-4"
              onClick={() => setPopupIceType('originalIce')}>
              ទឹកកកដើម (Original Ice)
            </button>
            <button type="button" className="font-semibold text-left border rounded-md p-4"
              onClick={() => setPopupIceType('largeHygiene20kg')}>
              ទឹកកកអនាម័យធំ (Large) 20kg
            </button>
            <button type="button" className="font-semibold text-left border rounded-md p-4"
              onClick={() => setPopupIceType('largeHygiene30kg')}>
              ទឹកកកអនាម័យធំ (Large) 30kg
            </button>
            <button type="button" className="font-semibold text-left border rounded-md p-4"
              onClick={() => setPopupIceType('smallHygiene20kg')}>
              ទឹកកកអនាម័យតូច (Small) 20kg
            </button>
            <button type="button" className="font-semibold text-left border rounded-md p-4"
              onClick={() => setPopupIceType('smallHygiene30kg')}>
              ទឹកកកអនាម័យតូច (Small) 30kg
            </button>
          </div>
        </div>

        {/* Popup for ice type input */}
        {popupIceType && (
          <div className="popup-overlay" onClick={handlePopupClose}>
            <div className="popup-content" onClick={e => e.stopPropagation()}>
              <button className="popup-close-btn" type="button" onClick={handlePopupClose}>&times;</button>
              {renderIceInputs(
                popupIceType,
                {
                  originalIce: 'ទឹកកកដើម (Original Ice)',
                  largeHygiene20kg: 'ទឹកកកអនាម័យធំ (Large) 20kg',
                  largeHygiene30kg: 'ទឹកកកអនាម័យធំ (Large) 30kg',
                  smallHygiene20kg: 'ទឹកកកអនាម័យតូច (Small) 20kg',
                  smallHygiene30kg: 'ទឹកកកអនាម័យតូច (Small) 30kg'
                }[popupIceType],
                true
              )}
            </div>
          </div>
        )}

        {/* Financial Details */}
        <h2 className="text-2xl font-semibold mb-4 mt-6">ព័ត៌មានហិរញ្ញវត្ថុ (Financial Details)</h2>

        {/* Current New Debt / Direct New Debt Input */}
        <div className="mb-4">
          <label htmlFor="newDebt">ប្រាក់ជំពាក់បច្ចុប្បន្ន (Current New Debt)</label>
          <input
            type="number"
            id="newDebt"
            value={newDebt}
            onChange={(e) => setNewDebt(e.target.value)}
            disabled={!!initialData} // Disable input if editing
            readOnly={!!initialData} // Prevent input if editing
          />
        </div>

        {/* Add New Debt Section (only for existing customers) */}
        {initialData && (
          <div className="mb-4 p-4 border rounded-md shadow-sm">
            <label htmlFor="addDebtAmount" className="mb-2">
              បញ្ចូលប្រាក់ជំពាក់ថ្មីបន្ថែម (Add More New Debt)
            </label>
            <input
              type="number"
              id="addDebtAmount"
              value={addDebtAmount}
              onChange={(e) => setAddDebtAmount(e.target.value)}
              placeholder="Enter amount to add"
            />
          </div>
        )}

        {/* Current Payment / Direct Payment Input */}
        <div className="mb-4">
          <label htmlFor="payment">ប្រាក់សងបច្ចុប្បន្ន (Current Payment)</label>
          <input
            type="number"
            id="payment"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            disabled={!!initialData} // Disable input if editing
            readOnly={!!initialData} // Prevent input if editing
          />
        </div>

        {/* Add Payment Section (only for existing customers) */}
        {initialData && (
          <div className="mb-4 p-4 border rounded-md shadow-sm">
            <label htmlFor="addPaymentAmount" className="mb-2">
              បញ្ចូលប្រាក់សងបន្ថែម (Add More Payment)
            </label>
            <input
              type="number"
              id="addPaymentAmount"
              value={addPaymentAmount}
              onChange={(e) => setAddPaymentAmount(e.target.value)}
              placeholder="Enter amount to pay"
            />
          </div>
        )}

        {/* Expenses */}
        <div className="mb-6">
          <label htmlFor="expenses">ថ្លៃសាំង បាយ (Expenses)</label>
          <input
            type="number"
            id="expenses"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
          />
        </div>

        {/* Loading, Error, and Success Messages */}
        {loading && <p className="text-center mb-4">{initialData ? 'Updating data...' : 'Saving data...'}</p>}
        {error && <p className="text-center mb-4" style={{ color: 'red' }}>Error: {error}</p>}
        {success && <p className="text-center mb-4" style={{ color: 'green' }}>Customer data {initialData ? 'updated' : 'saved'} successfully!</p>}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={initialData ? onClose : clearForm}
            disabled={loading}
          >
            {initialData ? 'Cancel' : 'Clear'}
          </button>
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? (initialData ? 'Updating...' : 'Saving...') : (initialData ? 'Update Customer' : 'Save Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IceOrderForm;