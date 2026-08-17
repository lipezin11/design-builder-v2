import https from 'node:https';

const API_KEY = 'c85b2e6a367324a52696cfbf9ac9d75a';

const endpoints = [
  'api.kie.ai/v1/models',
  'api.kie.ai/models',
  'kie.ai/api/v1/models',
  'api.kie.ai/v1/chat',
];

for (const endpoint of endpoints) {
  const [host, ...pathParts] = endpoint.split('/');
  const path = '/' + pathParts.join('/');
  
  console.log(`Testing: https://${host}${path}`);
  
  const options = {
    hostname: host,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Response: ${responseData.substring(0, 200)}\n`);
    });
  });

  req.on('error', (error) => {
    console.error(`  ERROR: ${error.message}\n`);
  });

  req.end();
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 500));
}
