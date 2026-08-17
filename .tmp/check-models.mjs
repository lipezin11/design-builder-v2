import https from 'node:https';

const API_KEY = 'sk-enndpoints-kziS06kwDqtednmBZCCZLlIKNB4qz_ww';

const options = {
  hostname: 'api-useoneai.onrender.com',
  path: '/api/v1/models',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log(responseData);
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error.message);
  process.exit(1);
});

req.end();
