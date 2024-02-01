function providerInit(regex, resp) {
    let providerId 
    const lines = resp.split('\n');
  
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
  module.exports = providerInit;