import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FileList = forwardRef(function FileList({ isDarkMode }, ref) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filter, setFilter] = useState('');

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/files');
      setFiles(response.data);
    } catch (error) {
      toast.error('Error fetching files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useImperativeHandle(ref, () => ({
    fetchFiles,
  }));

  const handleDownload = async (filename) => {
    setOperationInProgress(true);
    toast.info('Downloading file...');
    try {
      const response = await axios.get(`http://localhost:5000/download/${filename}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          toast.info(`Download progress: ${percentCompleted}%`);
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully!');
    } catch (error) {
      toast.error('Error downloading file: ' + error.message);
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleDelete = async (filename) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setOperationInProgress(true);
      toast.info('Deleting file...');
      try {
        await axios.delete(`http://localhost:5000/delete/${filename}`);
        toast.success('File deleted successfully!');
        await fetchFiles();
      } catch (error) {
        toast.error('Error deleting file: ' + error.message);
      } finally {
        setOperationInProgress(false);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post('http://localhost:5000/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('File uploaded successfully!');
        await fetchFiles();
      } catch (error) {
        toast.error('Error uploading file: ' + error.message);
      }
    }
  };

  const sortedAndFilteredFiles = files
    .filter(file => file.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      }
      return 0;
    });

  return (
    <div 
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl p-6 transform transition-all duration-300 hover:shadow-xl`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-0`}>
          Uploaded Files
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="name">Sort by name</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} hover:bg-opacity-80 transition-colors`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-white' : 'border-blue-600'}`}></div>
        </div>
      ) : sortedAndFilteredFiles.length === 0 ? (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          {filter ? 'No files match your search.' : 'No files uploaded yet. Upload your first file above!'}
        </div>
      ) : (
        <ul className="space-y-4">
          {sortedAndFilteredFiles.map((file, index) => (
            <li 
              key={index} 
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition duration-200`}
            >
              <div className="flex-1 min-w-0">
                <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium truncate`}>{file}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Uploaded recently</p>
              </div>
              <div className="flex space-x-3 mt-3 sm:mt-0">
                <button
                  onClick={() => handleDownload(file)}
                  disabled={operationInProgress}
                  className={`px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center
                    ${operationInProgress
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  disabled={operationInProgress}
                  className={`px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center
                    ${operationInProgress
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

FileList.displayName = 'FileList';

export default FileList;