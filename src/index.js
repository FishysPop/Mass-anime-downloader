const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
const ffmpeg = require('fluent-ffmpeg');
const probe = promisify(ffmpeg.ffprobe);

const search = require('./services/search')
const animeInfo = require('./services/animeInfo')

const providerInit = require('./processEpisode/providerInit')
const decryptAllAnime = require('./processEpisode/decryptAllAnime')
const getLinks = require('./processEpisode/getLinks');

const m3u8Extractor = require('./extractors/m3u8')


const aniurl = 'https://allanime.to'
const aniapi = 'https://api.allanime.day/api'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
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

rl.question('Enter the search keyword: ', async (searchKeyword) => {
  rl.question('Enter the translation type (sub or dub): ', async (translationType) => {

        const Userproviders = [1,2,3,4,5];
        const quality = 'best';
//1 wixmp
//2 dropbox
//3 wetranfer
//4 sharepoint
//5 gogoanime

(async () => {
  //search
    try {
      const searchResponse = await search(searchKeyword, translationType);
 
  console.log("Found result for:",searchResponse.data.data.shows.edges[0].name)
  if(translationType === 'sub') {
    console.log("Episodes:",searchResponse.data.data.shows.edges[0].availableEpisodes.sub)
  }
   else {
    console.log("Episodes:",searchResponse.data.data.shows.edges[0].availableEpisodes.dub)

  }
  rl.question('Enter the episode number or range (e.g.: 4-6): ', async (episodes) => {
    rl.close();

  const showId = searchResponse.data.data.shows.edges[0]._id
  function processEpisodeRange(episodes) {
    if (episodes.includes('-')) {
        const [start, end] = episodes.split('-').map(Number);
        const episodeList = [];
        
        for (let i = start; i <= end; i++) {
            episodeList.push(i.toString());
        }
        
        return episodeList;
    } else {
        return [episodes]; 
    }
}
  
  const episodeArray = processEpisodeRange(episodes);
  const episodes2 = [...episodeArray]
  
  async function processEpisode() {
    if (episodeArray.length > 0) {
      const currentIndex = episodes2.length - episodeArray.length;
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
    const response = await animeInfo(queryVariables,extensions)

      const data = response.data
      const resp = data?.data?.episode?.sourceUrls?.map(url => `${url.sourceName} : ${url.sourceUrl}`).join('\n');
      if (!resp) {
        console.log(`No results found for episode: ${currentEpisode}`)
        return;
      }
    
      let providerName;
      async function generateLink(providers, resp) {
        let providerId;
        switch (providers) {
            case 1:
                providerId = providerInit("Default", resp);
                providerName = 'wixmp'
                break;
            case 2:
                providerId = providerInit("Sak", resp);
                providerName = 'dropbox'
                break;
            case 3:
                providerId = providerInit("Kir", resp);
                providerName = 'wetransfer'
                break;
            case 4:
                providerId = providerInit("S-mp4", resp);
                providerName = 'sharepoint'
                break;
                default:
                  providerId = providerInit("Luf-mp4", resp);
                  providerName = 'gogoanime'
                  break;
              }
            
              if (!providerId) {
              //  console.log(`No link found for ${providerName}`);
                return;
              }
            
              providerId = decryptAllAnime(providerId);
              providerId = providerId.replace(/\/clock/g, '/clock.json');
              if (providerId) {
                try {
                  const links = await getLinks(providerId); 
                  return links
                } catch (error) {
                  console.error('Error fetching links:', error);
                  return
                }
              }
    };
    
    
    Promise.all(Userproviders.map(provider => generateLink(provider, resp)))
      .then(resolvedLinkLists => {
        resolvedLinkLists = resolvedLinkLists.filter(link => link !== undefined);
        const qualitylink = selectQuality(resolvedLinkLists, quality)
        const sanitizeFolderName = (name) => {
          return name.replace(/[<>:"/.\\|?*]/g, '_');
        };
      
      const MAX_DOWNLOAD_ATTEMPTS = 0;
      let retryCount = 0;
      const MAX_DOWNLOAD_TIME = 60 * 60 * 1000;
      
      const downloadFile = async () => {
        let filePath;
        const fileUrl = qualitylink;
        const currentDir = __dirname;
        const animeName = sanitizeFolderName(searchResponse.data.data.shows.edges[0].name);
        const parentDir = path.dirname(currentDir);
        const downloadsFolderPath = path.join(parentDir, 'downloads');
        const animeFolderPath = path.join(downloadsFolderPath, animeName);
        let downloadStarted = false;
    
        try {
          if (!fs.existsSync(downloadsFolderPath)) {
              fs.mkdirSync(downloadsFolderPath);
          }
      
          if (!fs.existsSync(animeFolderPath)) {
              fs.mkdirSync(animeFolderPath, { recursive: true });
          }
      
          if (fileUrl.endsWith('.m3u8')) {
              // Handle .m3u8 file processing
              const downloadedFilePath = await m3u8Extractor(fileUrl, animeFolderPath, animeName, currentEpisode, currentIndex);
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
          } else {
            let lastUpdate = Date.now();
            const filePath = path.join(animeFolderPath, `${animeName}_EP${currentEpisode}.mp4`);
              const writer = fs.createWriteStream(filePath);
              const response = await axios({
                  method: 'GET',
                  url: fileUrl,
                  responseType: 'stream',
                  onDownloadProgress: function(progressEvent) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    const now = Date.now();

                    if (now - lastUpdate >= 600) {
                      lastUpdate = now;
                      
                      process.stdout.moveCursor(-1000, `-${currentIndex + 1}`);
              
                      process.stdout.clearLine(1);
                      process.stdout.write(`Progress for EP${currentEpisode}: ${(percentCompleted || 0).toFixed(0)}%`);
                      process.stdout.moveCursor(-1000, 1000);
                    }
                  }
              });
              console.log(`Progress for EP${currentEpisode}: 0%`)
      
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
                    process.stdout.moveCursor(-1000, `-${currentIndex + 1}`);
                
                    process.stdout.clearLine(1);
                    process.stdout.write(`File downloaded: ${downloadedFilePath}`);
                    process.stdout.moveCursor(-1000, 1000);
                      return downloadedFilePath;
                  } else {
                      console.error('Downloaded file is not playable:', downloadedFilePath);
                  }
              } else {
                  console.error('Download failed or file does not exist.');
              }
          }
      } catch (error) {
          console.error('Error downloading or probing the file:', currentEpisode);
          console.log(error)
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
            console.log(error)
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
    }

        } catch (error) {
            console.error(error);
        }
      processEpisode();
    }
  }
  
  processEpisode();
});
  } catch (error) {
    console.error(error);
  }
  
})();

});
});