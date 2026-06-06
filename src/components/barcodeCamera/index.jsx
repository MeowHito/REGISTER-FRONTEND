import { Button, Modal } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function BarcodeCamera({ setToggle, toggle, callBack }) {
  const [codeReader, setCodeReader] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setCodeReader(new BrowserMultiFormatReader());
    return () => {
      codeReader?.reset();
    };
  }, []);

  useEffect(() => {
    if (toggle) {
      const codeReader = new BrowserMultiFormatReader();
      setCodeReader(codeReader);
      setTimeout(() => {
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, () => { });
      }, 500);
    } else {
      codeReader?.reset();
    }
  }, [toggle]);

  const scan = async () => {
    const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
    if (result.text) {
      onChange(result.text);
      setToggle(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject.getVideoTracks().forEach(track => track.stop());
    }
  };

  const onChange = (e) => {
    callBack(e)
  };

  const onCloseModal = useCallback(() => {
    setToggle(false);
  }, []);

  return (
    <Modal open={toggle} onCancel={onCloseModal} footer={null}>
      <div className="text-center">
        <>
          <video ref={videoRef} style={{ width: '100%', height: 'auto' }} autoPlay={true}></video>
          <Button type="primary" className="w-full mt-1 mb-4 bg-orange-500 text-white hover:!bg-orange-400" onClick={scan}>Scan</Button>
        </>
      </div>
    </Modal>
  );
}
