import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle2, ImagePlus, Lightbulb, LightbulbOff, RefreshCw, UploadCloud } from "lucide-react";
import "./QRScanner.css";

export default function QRScanner({ onResult, autoStart = false }) {
  const scannerRef = useRef(null);
  const fileRef = useRef(null);
  const startScannerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [readingImage, setReadingImage] = useState(false);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  const startScanner = async () => {
    setError("");
    try {
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode("upi-reader");
      if (scannerRef.current.isScanning) {
        setRunning(true);
        return;
      }
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length) throw new Error("No camera found. Upload a QR image instead.");
      const camera = cameras.find((item) => /back|rear|environment/i.test(item.label)) || cameras[0];
      await scannerRef.current.start(
        camera.id,
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        async (decodedText) => {
          setError("");
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop().catch(() => {});
          }
          setRunning(false);
          setTorchOn(false);
          onResult?.(decodedText);
        },
        () => {}
      );
      setRunning(true);
    } catch (err) {
      setError(err?.message || "Could not start the camera. Check camera permission or upload an image.");
      setRunning(false);
    }
  };

  startScannerRef.current = startScanner;

  useEffect(() => {
    if (!autoStart) return undefined;

    const timer = window.setTimeout(() => {
      startScannerRef.current?.();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [autoStart]);

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) await scannerRef.current.stop().catch(() => {});
    setRunning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current?.isScanning) {
      setError("Start the camera first to use the torch.");
      return;
    }
    try {
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((value) => !value);
      setError("");
    } catch {
      setError("Torch isn't supported by this camera or browser.");
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (selectedImage) URL.revokeObjectURL(selectedImage);
    const preview = URL.createObjectURL(file);
    setSelectedImage(preview);
    setError("");
    setReadingImage(true);

    try {
      await stopScanner();
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode("upi-reader");
      const decoded = await scannerRef.current.scanFileV2(file, true);
      onResult?.(decoded.decodedText);
    } catch {
      setError("We couldn't find a readable QR code in this image. Try a sharper, well-lit image.");
    } finally {
      setReadingImage(false);
      event.target.value = "";
    }
  };

  const clearImage = () => {
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setSelectedImage("");
    setError("");
  };

  return (
    <section className="qr-scanner-card">
      <div className="scanner-card-heading">
        <div>
          <span className="eyebrow">UPI SCANNER</span>
          <h3>Scan a payment QR</h3>
          <p>Keep the entire QR code inside the frame.</p>
        </div>
        <span className="scanner-heading-icon"><Camera size={19} /></span>
      </div>

      <div className={`scanner-visual ${running ? "scanner-is-running" : ""}`}>
        <div id="upi-reader" className="upi-reader" />
        {!running && (
          <div className="scanner-placeholder">
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Selected QR image preview" className="scanner-image-preview" />
                <span className="scanner-preview-label"><CheckCircle2 size={14} /> Image selected</span>
              </>
            ) : (
              <>
                <span className="scanner-placeholder-icon"><Camera size={29} /></span>
                <strong>{readingImage ? "Reading your QR…" : "Your scanner is ready"}</strong>
                <small>Start your camera or choose a QR image below.</small>
              </>
            )}
          </div>
        )}
        {running && <span className="scanner-live-pill"><span /> CAMERA ACTIVE</span>}
      </div>

      <div className="scanner-controls">
        {!running ? (
          <button className="primary-button" onClick={startScanner}><Camera size={17} /> Start camera</button>
        ) : (
          <button className="secondary-button scanner-stop" onClick={stopScanner}>Stop camera</button>
        )}
        <button className="gallery-button" onClick={() => fileRef.current?.click()} disabled={readingImage}>
          <ImagePlus size={17} /> {readingImage ? "Reading image…" : "Choose from gallery"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadFile} />
        <button className={`torch-button ${torchOn ? "torch-active" : ""}`} onClick={toggleTorch} aria-label="Toggle torch">
          {torchOn ? <Lightbulb size={18} /> : <LightbulbOff size={18} />}
          <span>{torchOn ? "Torch on" : "Torch"}</span>
        </button>
        {selectedImage && (
          <button className="scanner-clear-image" onClick={clearImage}><RefreshCw size={15} /> Remove image</button>
        )}
      </div>

      {error && <div className="scanner-error" role="alert">{error}</div>}

      <div className="scanner-privacy-note"><UploadCloud size={16} /><span>Choose a clear image from your device. QR content is read in this browser demo.</span></div>
      <p className="scanner-footnote">Camera access requires permission and usually HTTPS or localhost. Torch support depends on your device.</p>
    </section>
  );
}
