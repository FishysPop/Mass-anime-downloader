const axios = require('axios');

const headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://allanime.to',
    'Referer': 'https://allanime.to',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
  
  async function search(query, translationType) {
  const searchResponse = await axios.get('https://api.allanime.day/api', {
    headers: headers,
    params: {
        variables: JSON.stringify({
            search: {
                query: query
            },
            limit: 26,
            page: 1,
            translationType: translationType,
            countryOrigin: 'JP'
        }),
        extensions: JSON.stringify({
            persistedQuery: {
                version: 1,
                sha256Hash: '06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a'
            }
        })
    }
});

return searchResponse
}

module.exports = search;