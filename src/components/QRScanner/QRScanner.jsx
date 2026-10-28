import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Lightbulb,
  LightbulbOff,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import "./QRScanner.css";

export default function QRScanner({ onResult, autoStart = false }) {
  const scannerRef = useRef(null);
  const fileRef = useRef(null);
  const startScannerRef = useRef(null);
  const mountedRef = useRef(false);
  const busyRef = useRef(false);
  const runningRef = useRef(false);
  const resultHandledRef = useRef(false);
  const onResultRef = useRef(onResult);
  const selectedImageRef = useRef("");

  const [running, setRunning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [readingImage, setReadingImage] = useState(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const setRunningState = (value) => {
    runningRef.current = value;
    if (mountedRef.current) setRunning(value);
  };

  const setScannerError = (message) => {
    if (mountedRef.current) setError(message);
  };

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setRunningState(false);
      if (mountedRef.current) setTorchOn(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn("QR scanner stop:", err);
    } finally {
      setRunningState(false);
      if (mountedRef.current) setTorchOn(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!mountedRef.current || busyRef.current || runningRef.current) return;

    busyRef.current = true;
    resultHandledRef.current = false;
    setScannerError("");

    try {
      const reader = document.getElementById("upi-reader");

      if (!reader) {
        throw new Error("Scanner is not ready. Please try again.");
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("upi-reader");
      }

      const scanner = scannerRef.current;

      if (scanner.isScanning) {
        setRunningState(true);
        return;
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!mountedRef.current) return;

      if (!cameras?.length) {
        throw new Error("No camera found. Upload a QR image instead.");
      }

      const camera =
        cameras.find((item) => /back|rear|environment/i.test(item.label)) ||
        cameras[0];

      await scanner.start(
        camera.id,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (
            !mountedRef.current ||
            resultHandledRef.current ||
            busyRef.current
          ) {
            return;
          }

          resultHandledRef.current = true;
          busyRef.current = true;

          try {
            await stopScanner();
          } finally {
            busyRef.current = false;

            if (mountedRef.current) {
              onResultRef.current?.(decodedText);
            }
          }
        },
        () => {}
      );

      if (mountedRef.current) {
        setRunningState(true);
      } else {
        try {
          if (scanner.isScanning) await scanner.stop();
        } catch {
          // Component is already unmounted.
        }
      }
    } catch (err) {
      setScannerError(
        err?.message ||
          "Could not start the camera. Check camera permission or upload an image."
      );
      setRunningState(false);
    } finally {
      busyRef.current = false;
    }
  }, [stopScanner]);

  startScannerRef.current = startScanner;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const imageUrl = selectedImageRef.current;
      selectedImageRef.current = "";

      if (imageUrl) URL.revokeObjectURL(imageUrl);

      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!autoStart) return undefined;

    const timer = window.setTimeout(() => {
      startScannerRef.current?.();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [autoStart]);

  const toggleTorch = async () => {
    if (!scannerRef.current?.isScanning || busyRef.current) {
      setScannerError("Start the camera first to use the torch.");
      return;
    }

    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn }],
      });

      if (mountedRef.current) {
        setTorchOn((value) => !value);
        setError("");
      }
    } catch {
      setScannerError("Torch isn't supported by this camera or browser.");
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file || busyRef.current) {
      if (event.target) event.target.value = "";
      return;
    }

    busyRef.current = true;
    resultHandledRef.current = true;

    const previousImage = selectedImageRef.current;
    const preview = URL.createObjectURL(file);

    selectedImageRef.current = preview;

    if (previousImage) URL.revokeObjectURL(previousImage);

    setSelectedImage(preview);
    setError("");
    setReadingImage(true);

    try {
      await stopScanner();

      if (!mountedRef.current) return;

      const reader = document.getElementById("upi-reader");

      if (!reader) {
        throw new Error("Scanner is not ready. Please try again.");
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("upi-reader");
      }

      const decoded = await scannerRef.current.scanFileV2(file, true);

      if (mountedRef.current) {
        onResultRef.current?.(decoded.decodedText);
      }
    } catch (err) {
      console.warn("QR image scan:", err);

      setScannerError(
        "We couldn't find a readable QR code in this image. Try a sharper, well-lit image."
      );
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setReadingImage(false);
      }

      if (event.target) event.target.value = "";
    }
  };

  const clearImage = () => {
    const imageUrl = selectedImageRef.current;
    selectedImageRef.current = "";

    if (imageUrl) URL.revokeObjectURL(imageUrl);

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

        <span className="scanner-heading-icon">
          <Camera size={19} />
        </span>
      </div>

      <div className={`scanner-visual ${running ? "scanner-is-running" : ""}`}>
        <div id="upi-reader" className="upi-reader" />

        {!running && (
          <div className="scanner-placeholder">
            {selectedImage ? (
              <>
                <img
                  src={selectedImage}
                  alt="Selected QR image preview"
                  className="scanner-image-preview"
                />
                <span className="scanner-preview-label">
                  <CheckCircle2 size={14} /> Image selected
                </span>
              </>
            ) : (
              <>
                <span className="scanner-placeholder-icon">
                  <Camera size={29} />
                </span>
                <strong>
                  {readingImage ? "Reading your QR…" : "Your scanner is ready"}
                </strong>
                <small>
                  Start your camera or choose a QR image below.
                </small>
              </>
            )}
          </div>
        )}

        {running && (
          <span className="scanner-live-pill">
            <span /> CAMERA ACTIVE
          </span>
        )}
      </div>

      <div className="scanner-controls">
        {!running ? (
          <button
            className="primary-button"
            onClick={() => startScannerRef.current?.()}
            disabled={readingImage}
          >
            <Camera size={17} /> Start camera
          </button>
        ) : (
          <button
            className="secondary-button scanner-stop"
            onClick={stopScanner}
            disabled={readingImage}
          >
            Stop camera
          </button>
        )}

        <button
          className="gallery-button"
          onClick={() => fileRef.current?.click()}
          disabled={readingImage}
        >
          <ImagePlus size={17} />
          {readingImage ? "Reading image…" : "Choose from gallery"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={uploadFile}
        />

        <button
          className={`torch-button ${torchOn ? "torch-active" : ""}`}
          onClick={toggleTorch}
          aria-label="Toggle torch"
          disabled={readingImage}
        >
          {torchOn ? <Lightbulb size={18} /> : <LightbulbOff size={18} />}
          <span>{torchOn ? "Torch on" : "Torch"}</span>
        </button>

        {selectedImage && (
          <button className="scanner-clear-image" onClick={clearImage}>
            <RefreshCw size={15} /> Remove image
          </button>
        )}
      </div>

      {error && (
        <div className="scanner-error" role="alert">
          {error}
        </div>
      )}

      <div className="scanner-privacy-note">
        <UploadCloud size={16} />
        <span>
          Choose a clear image from your device. QR details are processed
          directly in your browser.
        </span>
      </div>

      <p className="scanner-footnote">
        Camera access requires permission and usually HTTPS or localhost. Torch
        support depends on your device.
      </p>
    </section>
  );
}
