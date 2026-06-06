import React, { useState, useEffect } from 'react';
import { Button, Input } from 'antd';

export default function BarcodeScanner({ callBack }) {
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    globalThis.addEventListener('keypress', handleKeyPress);

    return () => {
      globalThis.removeEventListener('keypress', handleKeyPress);
    };
  }, [barcode]);
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleScan();
    }
  };

  const handleScan = () => {
    if (barcode.trim() === '') return;
    callBack(barcode)
    setBarcode('');
  };

  return (
    <div className="my-8 text-center">
      <h1 className="mb-6">Barcode Scanner</h1>
      <Input
        className="w-[80%] lg:w-1/2"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Scan barcode here"
        autoFocus
      />
      <Button className="ml-0.5 bg-cyan-600" type="primary" onClick={handleScan}>
        Scan
      </Button>
    </div>
  );
}
