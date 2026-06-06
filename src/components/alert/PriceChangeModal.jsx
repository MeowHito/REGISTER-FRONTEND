import { Modal } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const PriceChangeModal = ({
  open = false,
  oldPrice = 0,
  newPrice = 0,
  title = "ราคาได้อัพเดท",
  currency = "บาท",
  autoCloseDuration = 4000,
  onClose = () => {},
}) => {
  const [progress, setProgress] = useState(100);
  const isPriceUp = newPrice > oldPrice;
  const priceDiff = Math.abs(newPrice - oldPrice);

  useEffect(() => {
    if (!open) {
      setProgress(100);
      return;
    }

    const interval = 50;
    const decrement = (interval / autoCloseDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [open, autoCloseDuration, onClose]);

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={320}
      maskClosable
      onCancel={onClose}
      styles={{
        body: { padding: '24px 20px 16px' },
      }}
    >
      <div className="flex flex-col items-center">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isPriceUp ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          {isPriceUp ? (
            <ArrowUpOutlined className="text-3xl text-red-500" />
          ) : (
            <ArrowDownOutlined className="text-3xl text-green-500" />
          )}
        </div>

        {/* Title */}
        <div className="text-base font-semibold text-gray-700 mb-5">
          {title}
        </div>

        {/* Price comparison */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xl font-medium text-gray-400 line-through">
            {oldPrice.toLocaleString()}
          </span>
          <span className="text-gray-400">→</span>
          <span
            className={`text-2xl font-bold ${
              isPriceUp ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {newPrice.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">{currency}</span>
        </div>

        {/* Difference badge */}
        <div
          className={`px-5 py-2 rounded-full border ${
            isPriceUp
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <span
            className={`font-semibold text-sm ${
              isPriceUp ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isPriceUp ? '+' : '-'}
            {priceDiff.toLocaleString()} {currency}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full mt-5 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-linear rounded-full ${
              isPriceUp ? 'bg-red-400' : 'bg-green-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default PriceChangeModal;
