const axios = require('axios');

async function animeInfo(queryVariables, extensions) {
    
const response = await axios.get('https://api.allanime.day/api', {
    params: { variables: JSON.stringify(queryVariables), extensions: JSON.stringify(extensions) },
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      Referer: 'https://youtu-chan.com/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });

  return response
}


module.exports = animeInfo;