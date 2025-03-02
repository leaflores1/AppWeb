import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';

function ImageCropper({ file, onCancel, onComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const containerRef = useRef(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPx) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) {
      console.error("No se ha obtenido el área recortada.");
      return;
    }
    try {
      const croppedFile = await getCroppedImg(file, croppedAreaPixels);
      onComplete(croppedFile);
    } catch (error) {
      console.error("Error al recortar la imagen:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleDone();
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="cropper-container"
      style={{ position: 'relative', width: '100%', height: '400px', background: '#333' }}
    >
      <Cropper
        image={URL.createObjectURL(file)}
        crop={crop}
        zoom={zoom}
        aspect={1 / 1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
      />
      <div 
        className="flex gap-4 justify-center mt-4"
        style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
      >
        <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={onCancel}>Cancelar</button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleDone}>Hecho</button>
      </div>
    </div>
  );
}

export default ImageCropper;
