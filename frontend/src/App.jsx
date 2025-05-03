import { useState, useRef, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import FileList from './FileList';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Theme Context
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div className={isDarkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

function DigitalClock() {
  const { isDarkMode } = useContext(ThemeContext);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="text-center mb-4">
      <div className={`inline-block ${isDarkMode ? 'bg-gray-700' : 'bg-gray-800'} text-white px-6 py-3 rounded-lg shadow-lg`}>
        <span className="text-2xl font-mono font-bold">
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
}

function App() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transferSpeed, setTransferSpeed] = useState(0);
  const fileListRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      toast.info('File selected: ' + selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setTransferSpeed(0);
    const startTime = Date.now();
    let lastLoaded = 0;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total;
          const progress = Math.round((loaded * 100) / total);
          setUploadProgress(progress);

          // Calculate transfer speed
          const currentTime = Date.now();
          const timeElapsed = (currentTime - startTime) / 1000; // in seconds
          const bytesPerSecond = loaded / timeElapsed;
          setTransferSpeed(bytesPerSecond);

          lastLoaded = loaded;
        }
      });
      
      toast.success('File uploaded successfully!');
      setFile(null);
      fileListRef.current.fetchFiles();
    } catch (error) {
      toast.error('Error uploading file: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setTransferSpeed(0);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'} py-8 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <DigitalClock />
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-opacity-80 transition-colors`}
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>

        <h1 className={`text-4xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Data Backup and Recovery
        </h1>
        <p className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Secure and reliable file management system
        </p>

        {/* File Upload Section */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl p-6 mb-8 transform transition-all duration-300 hover:shadow-xl`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full">
              <label className="block w-full">
                <span className="sr-only">Choose file</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className={`block w-full text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}
                    file:mr-4 file:py-3 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    ${isDarkMode ? 'file:bg-gray-700 file:text-white' : 'file:bg-blue-50 file:text-blue-700'}
                    hover:file:bg-opacity-80
                    cursor-pointer`}
                />
              </label>
              {file && (
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className={`px-6 py-3 rounded-lg font-semibold transition duration-200
                ${isUploading || !file
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Upload Progress: {uploadProgress}%
                </span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {transferSpeed > 0 ? `Speed: ${(transferSpeed / 1024 / 1024).toFixed(2)} MB/s` : ''}
                </span>
              </div>
              <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5`}>
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* File List Section */}
        <FileList ref={fileListRef} isDarkMode={isDarkMode} />
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
}

// Wrap the app with ThemeProvider
export default function AppWrapper() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}