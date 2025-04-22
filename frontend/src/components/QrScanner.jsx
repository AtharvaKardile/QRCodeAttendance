import React, {useEffect, useRef, useState} from 'react';
// Note: Using html5-qrcode library for scanning. Install it:
// npm install html5-qrcode
import {Html5QrcodeScanner} from 'html5-qrcode';

function QrScanner({onScanSuccess, onScanError}) {
    const scannerRef = useRef(null);
    const [scannerActive, setScannerActive] = useState(false);

    useEffect(() => {
        // Ensure the div exists before initializing
        if (!scannerRef.current || scannerActive) return;

        // Create a new scanner instance targeting the div
        const qrScanner = new Html5QrcodeScanner(
            "qr-reader", // ID of the div element
            {
                fps: 10, // Frames per second for scanning
                qrbox: {width: 250, height: 250}, // Size of the scanning box (optional)
                rememberLastUsedCamera: true, // Remember camera choice
                supportedScanTypes: [0] // 0 = SCAN_TYPE_CAMERA
            },
            false // verbose = false
        );

        const successCallback = (decodedText, decodedResult) => {
            console.log(`Scan result: ${decodedText}`, decodedResult);
            onScanSuccess(decodedText); // Pass the decoded text (QR ID) up
            // Stop the scanner after successful scan
            qrScanner.clear().catch(error => {
                console.error("Failed to clear scanner:", error);
            });
            setScannerActive(false);
        };

        const errorCallback = (errorMessage) => {
            // Errors can be frequent (e.g., no QR found), only log significant ones or pass up if needed
            // console.warn(`QR Scan Error: ${errorMessage}`);
            // You might want to call onScanError for specific errors if required
            // onScanError(errorMessage);
        };

        // Start scanning
        qrScanner.render(successCallback, errorCallback);
        setScannerActive(true);


        // Cleanup function to stop the scanner when the component unmounts or hides
        return () => {
            if (qrScanner && scannerActive) {
                qrScanner.clear().catch(error => {
                    console.error("Failed to clear scanner on unmount:", error);
                });
                setScannerActive(false);
            }
        };
        // Dependencies: only run when the component mounts and callbacks change
    }, [onScanSuccess, onScanError, scannerActive]); // Added scannerActive to dependencies

    return (
        <div>
            {/* The div where the scanner video feed and UI will be rendered */}
            <div id="qr-reader" ref={scannerRef} style={{width: '100%', maxWidth: '500px', margin: 'auto'}}></div>
            {!scannerActive && <p className="text-center text-gray-500 mt-2">Initializing scanner...</p>}
        </div>
    );
}

export default QrScanner;