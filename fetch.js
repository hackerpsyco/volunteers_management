const fs = require('fs');
fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json')
  .then(r => r.json())
  .then(d => {
    const codes = d
      .filter(c => c.callingCode && c.callingCode.length > 0)
      .map(c => ({
        code: c.cca2,
        name: c.name.common,
        dialCode: '+' + c.callingCode[0]
      }))
      .sort((a,b) => a.name.localeCompare(b.name));
    
    fs.writeFileSync('src/utils/geoDataAuto.json', JSON.stringify(codes, null, 2));
    console.log('Saved', codes.length, 'countries to src/utils/geoDataAuto.json');
  })
  .catch(console.error);
