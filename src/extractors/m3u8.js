const axios = require('axios');
const path = require('path');
let ffmpeg = require("fluent-ffmpeg");

async function m3u8Extractor(fileUrl, animeFolderPath, animeName, currentEpisode, currentIndex,) {
    try {
        const response = await axios.get(fileUrl); // Fetch the .m3u8 file
        const m3u8Content = response.data;

        // Parse the content to extract the direct links to video segments
        const lines = m3u8Content.split('\n');
        const qualityOptions = [];
        let currentQuality = {};
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                const qualityInfo = line.split(',')[1];
                const bandwidth = qualityInfo.split('=')[1];
                currentQuality = { bandwidth, url: lines[i + 1].trim() };
                qualityOptions.push(currentQuality);
            }
        }

        // Find the best quality option based on bandwidth
        const bestQuality = qualityOptions.reduce((prev, curr) => (
            parseInt(curr.bandwidth) > parseInt(prev.bandwidth) ? curr : prev
        ));

        // Replace the part of the URL with the best quality link
        const modifiedFileUrl = fileUrl.replace(/\/ep\.\d+\.\d+\.m3u8$/, `/${path.basename(bestQuality.url)}`);
        const outputFilePath = path.join(animeFolderPath, `${animeName}_EP${currentEpisode}.mp4`)

        console.log(`Progress for EP${currentEpisode}: 0%`)
        let lastUpdate = Date.now();
        return new Promise((resolve, reject) => {
            ffmpeg(modifiedFileUrl)
                .on("error", error => {
                    reject(new Error(error));
                })
                .on("end", () => {
                    resolve(outputFilePath);
                })
                .on('progress', function(progress) {
                    const now = Date.now();
                    if (now - lastUpdate >= 600) {
                        lastUpdate = now
                        process.stdout.moveCursor(-1000, `-${currentIndex + 1}`);
                
                        process.stdout.clearLine(1);
                        process.stdout.write(`Progress for EP${currentEpisode}: ${(progress.percent || 0).toFixed(1)}%`);
                        process.stdout.moveCursor(-1000, 1000);
                    }
                })
                .outputOptions("-c copy")
                .outputOptions("-bsf:a aac_adtstoasc")
                .output(outputFilePath)
                .run();
        });

    } catch (error) {
        console.error('Error extracting or converting m3u8 segment:', error);
        throw error;
    }
}

module.exports = m3u8Extractor;
