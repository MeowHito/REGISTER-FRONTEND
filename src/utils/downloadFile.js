import axios from 'axios';
import fileDownload from 'js-file-download';

const downloadFile = (url, filename) => {
  axios.get(url, { responseType: 'blob' })
    .then(response => {
      fileDownload(response.data, filename);
    })
    .catch(error => {
      console.error('Error downloading file:', error);
    });
};

export default downloadFile;