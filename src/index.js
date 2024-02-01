const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
const ffmpeg = require('fluent-ffmpeg');
const probe = promisify(ffmpeg.ffprobe);




const aniurl = 'https://allanime.to'
const aniapi = 'https://api.allanime.day/api'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the search keyword: ', async (searchKeyword) => {
    rl.question('Enter the episode range (e.g., 4-6): ', async (episodes) => {
      rl.question('Enter the translation type (sub or dub): ', async (translationType) => {
        rl.close();

        const Userproviders = [1, 2, 3, 4, 5];
        const quality = 'best';
//1 wixmp
//2 dropbox
//3 wetranfer
//4 sharepoint
//5 gogoanime

const headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': aniurl,
    'Referer': aniurl,
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};
const test = "true"
if(test === "true") { 
(async () => {
  //search
    try {
        const searchResponse = await axios.get(aniapi, {
            headers: headers,
            params: {
                variables: JSON.stringify({
                    search: {
                        query: searchKeyword
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
 
  console.log("Found result for:",searchResponse.data.data.shows.edges[0].name)
  if(translationType === 'sub') {
    console.log("Episodes:",searchResponse.data.data.shows.edges[0].availableEpisodes.sub)
  }
   else {
    console.log("Episodes:",searchResponse.data.data.shows.edges[0].availableEpisodes.dub)

  }
  const showId = searchResponse.data.data.shows.edges[0]._id
  function processEpisodeRange(episodes) {
    const [start, end] = episodes.split('-').map(Number);
    const episodeList = [];
    
    for (let i = start; i <= end; i++) {
      episodeList.push(i.toString());
    }
    
    return episodeList;
  }
  
  const episodeArray = processEpisodeRange(episodes);
  
  async function processEpisode() {
    if (episodeArray.length > 0) {
      const currentEpisode = episodeArray.shift();

      const queryVariables = {
        showId,
        translationType: translationType,
        episodeString: currentEpisode,
      };
      const extensions = {
        persistedQuery: {
          version: 1,
          sha256Hash: '5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0',
        },
      };

      try {
        //anime info
        const response = await axios.get(aniapi, {
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
    
    
    
    
      const data = response.data
      const resp = data?.data?.episode?.sourceUrls?.map(url => `${url.sourceName} : ${url.sourceUrl}`).join('\n');
      if (!resp) {
        console.log(`No results found for episode: ${currentEpisode}`)
        return;
      }
    
      let providerName;
      async function generateLink(providers) {
        let providerId;
        switch (providers) {
            case 1:
                providerId = providerInit("wixmp", "Default");
                break;
            case 2:
                providerId = providerInit("dropbox", "Sak");
                break;
            case 3:
                providerId = providerInit("wetransfer", "Kir");
                break;
            case 4:
                providerId = providerInit("sharepoint", "S-mp4");
                break;
                default:
                  providerId = providerInit("gogoanime", "Luf-mp4");
                  break;
              }
            
              if (!providerId) {
                console.log(`No link found for ${providerName}`);
                return [];
              }
            
              providerId = decryptAllAnime(providerId);
              providerId = providerId.replace(/\/clock/g, '/clock.json');
              if (providerId) {
                try {
                  const links = await getLinks(providerId); // Wait for getLinks to complete
                  return links || [];
                } catch (error) {
                  console.error('Error fetching links:', error);
                  return [];
                }
              }
            
              return [];
            
    
    
    
    function providerInit(provider_name, regex) {
      const lines = resp.split('\n');
      providerName = provider_name
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(RegExp(regex));
    
      if (matches) {
        providerId = line.split(':')[1].trim();
        providerId = providerId.replace(/-/g, '');
        break; 
      }
    }
    return providerId
    }
    
    function decryptAllAnime(input) {
      let decryptedString = '';
      const hexValues = input.match(/.{1,2}/g) || []; 
    
      for (let i = 0; i < hexValues.length; i++) {
        const hex = hexValues[i];
        const dec = parseInt(hex, 16); 
        const xor = dec ^ 56; 
        const oct = xor.toString(8).padStart(3, '0'); 
        decryptedString += String.fromCharCode(parseInt(oct, 8));
      }
    
      return decryptedString;
    }
    
    function decryptAllAnime(input) {
      const hexValues = input.match(/.{1,2}/g) || [];
      let result = '';
      hexValues.forEach(hex => {
          const dec = parseInt(hex, 16);
          const xor = dec ^ 56;
          const oct = xor.toString(8).padStart(3, '0');
          result += String.fromCharCode(parseInt(oct, 8));
      });
      return result;
    }
    
    async function getLinks(provider_id) {
      try {
      const response2 = await axios.get(`https://embed.ssbcontent.site${provider_id}`, {
        headers: {
          'User-Agent': headers.User_Agent
        }
      })
      let episodeLink = response2.data.links[0].link;
      if (episodeLink.includes('repackager.wixmp.com')) {
        const matches = episodeLink.match(/repackager\.wixmp\.com\/([^\/]+)\/mp4\/file\.mp4\.urlset/);
        if (matches && matches.length > 1) {
            const extractLink = matches[1];
    
            const regexResult = episodeLink.match(/.*,([^/]*),\/mp4.*/g);
            if (regexResult) {
                regexResult.forEach(match => {
                    const j = match.split(',')[0];
                    console.log(`${j} >${extractLink}`);
                    linkList.push(extractLink);
                });
            }
        }
    
      } else if (episodeLink.includes('vipanicdn') || episodeLink.includes('anifastcdn')) {
        if (episodeLink.includes('original.m3u')) {
          linkList.push(episodeLink)
        } else {
          let extractLink = episodeLink.split('>')[0];
          let relativeLink = extractLink.replace(/[^/]*$/, '');
          let curlResponse = episodeLink;
          let processedData = curlResponse.replace(/^#.*x/g, '').replace(/,.*/g, 'p');
          let formattedData = processedData.split('\n').map(item => item.replace('>', `>${relativeLink}`)).sort().reverse().join('\n');
          linkList.push(formattedData)
        }
      } else {
        if (episodeLink) {
          linkList.push(episodeLink)
        }
      }
    
    
    
    
    
    
        }catch(error) {
          console.error('Error fetching data:', error);
        };
    
      };
    
    };
    
    let linkList = [];
    
    Promise.all(Userproviders.map(provider => generateLink(provider)))
      .then(resolvedLinkLists => {
        const qualitylink = selectQuality(linkList, quality)
        const sanitizeFolderName = (name) => {
          // Remove characters that might cause issues in folder names
          return name.replace(/[<>:"/\\|?*]/g, '_');
        };
      
      const MAX_DOWNLOAD_ATTEMPTS = 3;
      let retryCount = 0;
      const MAX_DOWNLOAD_TIME = 5 * 60 * 1000;
      
      const downloadFile = async () => {
        let filePath;
        const fileUrl = qualitylink;
        const currentDir = __dirname;
        const animeName = sanitizeFolderName(searchResponse.data.data.shows.edges[0].name);
        console.log(`Starting download for :${currentEpisode}`)
        const parentDir = path.dirname(currentDir);
        const downloadsFolderPath = path.join(parentDir, 'downloads');
        const animeFolderPath = path.join(downloadsFolderPath, animeName);
        let downloadStarted = false;
    
        try {
            // Ensure the 'downloads' folder exists, if not, create it
            if (!fs.existsSync(downloadsFolderPath)) {
                fs.mkdirSync(downloadsFolderPath);
            }
    
            // Check if the anime-specific folder exists
            if (!fs.existsSync(animeFolderPath)) {
                fs.mkdirSync(animeFolderPath, { recursive: true });
            }
      
              const filePath = path.join(animeFolderPath, `${animeName}_EP${currentEpisode}.mp4`);
              const writer = fs.createWriteStream(filePath);
              console.log(`${currentEpisode} link :${fileUrl}`)
              const response = await axios({
                  method: 'GET',
                  url: fileUrl,
                  responseType: 'stream',
              });
      
              response.data.pipe(writer);
              downloadStarted = true;
      
              const downloadPromise = new Promise((resolve, reject) => {
                  writer.on('finish', () => {
                      resolve(filePath);
                  });
      
                  writer.on('error', (error) => {
                      reject(error);
                  });
              });
      
              const timeoutPromise = new Promise((resolve, reject) => {
                  setTimeout(() => {
                      if (!downloadStarted) {
                          reject(new Error('Download timed out'));
                      }
                  }, MAX_DOWNLOAD_TIME);
              });
      
              const downloadedFilePath = await Promise.race([downloadPromise, timeoutPromise]);

              if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
                  const isPlayable = await checkMP4FilePlayable(downloadedFilePath);
                  if (isPlayable) {
                      console.log('File downloaded:', downloadedFilePath);
                      return downloadedFilePath;
                  } else {
                      console.error('Downloaded file is not playable:', downloadedFilePath);
                  }
              } else {
                  console.error('Download failed or file does not exist.');
              }
          } catch (error) {
              console.error('Error downloading or probing the file:', currentEpisode);
          }
      
          // Retry download logic with delay
          if (retryCount < MAX_DOWNLOAD_ATTEMPTS) {
              console.log(`Retrying download attempt ${retryCount + 1}...`);
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retry
              return downloadFile(); // Retry the download
          } else {
              console.error(`Exceeded maximum download attempts (${MAX_DOWNLOAD_ATTEMPTS}). Deleting file...`);
              if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath); // Delete the file
                  console.log('File deleted:', filePath);
              }
          }
      };
      
      // Usage:
      downloadFile()
          .then((filePath) => {
          })
          .catch((error) => {
              console.error('Error:', error);
          });
      })
      .catch(error => {
        console.error("Error occurred:", error);
        // This will execute if any of the promises fail
      });
      
      const checkMP4FilePlayable = async (filePath) => {
        try {
            const info = await probe(filePath);
            // Check the 'format' property or any other property as needed to validate the file
            return true; // File is playable
        } catch (error) {
            console.error('Error while probing file:', );
            return false; // File is not playable
        }
    };

      function selectQuality(links, quality) {
        let result = '';
    
        switch (quality) {
            case 'best':
                result = links[0]; // Assumes links are already ordered from best to worst
                return result
                break;
            case 'worst':
                const filteredLinks = links.filter(link => /^\d{3,4}$/.test(link));
                result = filteredLinks[filteredLinks.length - 1];
                return result
                break;
            default:
                // Find the first link that matches the specified quality
                result = links.find(link => link.includes(quality)) || links[0];
                return result
                break;
        }
    
        if (!result) {
            console.log('Specified quality not found, defaulting to best');
            result = links[0];
        }
    
        return result.split('>')[1];
    }
    
    
    
        } catch (error) {
            console.error(error);
        }
  





      processEpisode();
    }
  }
  
  processEpisode();

  } catch (error) {
    console.error(error);
  }
})();
}
});
});
});