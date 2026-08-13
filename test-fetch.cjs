const https = require('https');
const url = 'https://script.google.com/macros/s/AKfycbzIAQsdtWl1gIYv8i_OrcbFG9pPrAKVmHVZk2TsAFfxSmb9QYY9hSUWfNWQPcvlfWCbkA/exec';

function fetchUrl(targetUrl) {
  https.get(targetUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchUrl(res.headers.location);
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const kamaya = json.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes('kamaya')));
        console.log('kamaya results:', kamaya);
      } catch(e) {
        console.log('Error parsing JSON:', data.substring(0, 200));
      }
    });
  });
}
fetchUrl(url);
