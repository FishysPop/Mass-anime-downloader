const axios = require('axios');
async function getLinks(provider_id) {
    try {

        
    const response2 = await axios.get(`https://allanime.day${provider_id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    let episodeLink = response2.data.links[0].link;
    if(!episodeLink) return console.log("failed to get links")
    if (episodeLink.includes('repackager.wixmp.com')) {
      const matches = episodeLink.match(/repackager\.wixmp\.com\/([^\/]+)\/mp4\/file\.mp4\.urlset/);
      if (matches && matches.length > 1) {
          const extractLink = matches[1];
  
          const regexResult = episodeLink.match(/.*,([^/]*),\/mp4.*/g);
          if (regexResult) {
              regexResult.forEach(match => {
                  const j = match.split(',')[0];
                  return extractLink
              });
          }
      }
  
    } else if (episodeLink.includes('vipanicdn') || episodeLink.includes('anifastcdn')) {
      if (episodeLink.includes('original.m3u')) {
        return episodeLink;
      } else {
        let extractLink = episodeLink.split('>')[0];
        let relativeLink = extractLink.replace(/[^/]*$/, '');
        let curlResponse = episodeLink;
        let processedData = curlResponse.replace(/^#.*x/g, '').replace(/,.*/g, 'p');
        let formattedData = processedData.split('\n').map(item => item.replace('>', `>${relativeLink}`)).sort().reverse().join('\n');
        return formattedData
      }
    } else {
      if (episodeLink) {
        return episodeLink
      }
    }
      }catch(error) {
        console.error('Error fetching data:', error);
      };
    };
    module.exports = getLinks;
