'use client';

import { useState } from 'react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; feedback: string; immediate: boolean }) => void;
  isLoading?: boolean;
}

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using_features', label: 'Not using the features' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'found_alternative', label: 'Found a better alternative' },
  { value: 'temporary_break', label: 'Taking a temporary break' },
  { value: 'other', label: 'Other' }
];

export default function CancellationModal({ isOpen, onClose, onConfirm, isLoading = false }: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [immediate, setImmediate] = useState(false);
  const [step, setStep] = useState<'reason' | 'feedback' | 'confirm'>('reason');

  const handleSubmit = () => {
    onConfirm({
      reason: selectedReason,
      feedback,
      immediate
    });
  };

  const resetForm = () => {
    setSelectedReason('');
    setFeedback('');
    setImmediate(false);
    setStep('reason');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Cancel Subscription
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === 'reason' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Why are you canceling?
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Help us improve by letting us know why you&apos;re leaving.
                </p>
              </div>

              <div className="space-y-2">
                {CANCELLATION_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="text-[#9146FF] focus:ring-[#9146FF]"
                    />
                    <span className="text-white">{reason.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('feedback')}
                  disabled={!selectedReason}
                  className="px-4 py-2 bg-[#9146FF] text-white rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 'feedback' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Additional Feedback (Optional)
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Is there anything specific we could have done better?
                </p>
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback helps us improve..."
                className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-[#9146FF] focus:ring-1 focus:ring-[#9146FF] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {feedback.length}/500 characters
              </p>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setStep('reason')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="px-4 py-2 bg-[#9146FF] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Confirm Cancellation
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Choose when you&apos;d like your subscription to end.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="timing"
                    checked={!immediate}
                    onChange={() => setImmediate(false)}
                    className="text-[#9146FF] focus:ring-[#9146FF] mt-1"
                  />
                  <div>
                    <span className="text-white font-medium">End at billing period</span>
                    <p className="text-gray-400 text-sm mt-1">
                      Keep access to premium features until your current billing period ends. No refund will be issued.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="timing"
                    checked={immediate}
                    onChange={() => setImmediate(true)}
                    className="text-[#9146FF] focus:ring-[#9146FF] mt-1"
                  />
                  <div>
                    <span className="text-white font-medium">Cancel immediately</span>
                    <p className="text-gray-400 text-sm mt-1">
                      Lose access to premium features right away. No refund will be issued.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mt-4">
                <p className="text-red-300 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. You&apos;ll need to create a new subscription to regain access to premium features.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setStep('feedback')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}