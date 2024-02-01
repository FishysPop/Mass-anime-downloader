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
  module.exports = decryptAllAnime;