'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiMapPin, FiFileText } from 'react-icons/fi';
import { RiIceCreamLine } from 'react-icons/ri';

/**
 * Modal component for PSRs to record shop visits
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Function to close the modal
 * @param {Object} props.shop Shop data to display and record visit for
 * @param {Function} props.onSubmit Function to handle form submission
 */
export default function ShopVisitModal({ isOpen, onClose, shop, onSubmit }) {
  const [formData, setFormData] = useState({
    shopId: shop?.id || '',
    status: 'visited', // Default to 'visited'
    notes: '',
    fridgeChecks: {
      working: true,
      clean: true,
      properlyStocked: true,
      temperatureCorrect: true,
      needsRepair: false,
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when shop changes
  useEffect(() => {
    if (shop) {
      setFormData(prev => ({
        ...prev,
        shopId: shop.id
      }));
    }
  }, [shop]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for fridge checks
  const handleFridgeCheckChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      fridgeChecks: {
        ...prev.fridgeChecks,
        [name]: checked
      }
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.status) {
      newErrors.status = 'Please select a visit status';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format data for submission
      const visitData = {
        shopId: formData.shopId,
        status: formData.status,
        notes: formData.notes,
        fridgeChecks: formData.fridgeChecks
      };
      
      await onSubmit(visitData);
      onClose();
    } catch (error) {
      console.error('Error submitting visit:', error);
      setErrors({ submit: 'Failed to submit visit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen || !shop) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-blue-50 px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-blue-900 flex items-center">
              <FiMapPin className="mr-2 text-blue-600" />
              Record Visit: {shop.name}
            </h3>
            <button
              type="button"
              className="rounded-md bg-blue-50 text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          {/* Shop Info */}
          <div className="bg-white px-4 py-3 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              <p>{shop.addressText || 'No address available'}</p>
              <p className="mt-1">
                <span className="font-medium">Freezers:</span> {shop.fridgeCount || 0}
              </p>
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="space-y-6">
                {/* Visit Status */}
                <div>
                  <label className="text-base font-medium text-gray-900 flex items-center">
                    <FiCheckCircle className="mr-2 text-green-600" />
                    Visit Status
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Did you successfully visit this shop?
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="visited"
                        name="status"
                        type="radio"
                        value="visited"
                        checked={formData.status === 'visited'}
                        onChange={handleChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="visited" className="ml-3 block text-sm font-medium text-gray-700">
                        Yes, I visited this shop
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="not_visited"
                        name="status"
                        type="radio"
                        value="not_visited"
                        checked={formData.status === 'not_visited'}
                        onChange={handleChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="not_visited" className="ml-3 block text-sm font-medium text-gray-700">
                        No, I couldn't visit this shop
                      </label>
                    </div>
                  </div>
                  {errors.status && (
                    <p className="mt-2 text-sm text-red-600">{errors.status}</p>
                  )}
                </div>
                
                {/* Freezer Condition Checks - Only show if visited */}
                {formData.status === 'visited' && (
                  <div>
                    <label className="text-base font-medium text-gray-900 flex items-center">
                      <RiIceCreamLine className="mr-2 text-pink-600" />
                      Freezer Condition
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      Check all that apply to the freezers at this location
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          id="working"
                          name="working"
                          type="checkbox"
                          checked={formData.fridgeChecks.working}
                          onChange={handleFridgeCheckChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="working" className="ml-3 block text-sm font-medium text-gray-700">
                          Freezers are working properly
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="clean"
                          name="clean"
                          type="checkbox"
                          checked={formData.fridgeChecks.clean}
                          onChange={handleFridgeCheckChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="clean" className="ml-3 block text-sm font-medium text-gray-700">
                          Freezers are clean and well-maintained
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="properlyStocked"
                          name="properlyStocked"
                          type="checkbox"
                          checked={formData.fridgeChecks.properlyStocked}
                          onChange={handleFridgeCheckChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="properlyStocked" className="ml-3 block text-sm font-medium text-gray-700">
                          Freezers are properly stocked
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="temperatureCorrect"
                          name="temperatureCorrect"
                          type="checkbox"
                          checked={formData.fridgeChecks.temperatureCorrect}
                          onChange={handleFridgeCheckChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="temperatureCorrect" className="ml-3 block text-sm font-medium text-gray-700">
                          Temperature is correct
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="needsRepair"
                          name="needsRepair"
                          type="checkbox"
                          checked={formData.fridgeChecks.needsRepair}
                          onChange={handleFridgeCheckChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="needsRepair" className="ml-3 block text-sm font-medium text-gray-700">
                          Freezers need repair or maintenance
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="text-base font-medium text-gray-900 flex items-center">
                    <FiFileText className="mr-2 text-gray-600" />
                    Notes
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Add any additional information about your visit
                  </p>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Optional notes about your visit..."
                  />
                </div>
                
                {/* Form submission error */}
                {errors.submit && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiAlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{errors.submit}</h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-300"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Visit'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
