const Axios = require('axios');
const Chalk = require('chalk');
const Fs = require('fs');
const Path = require('path');

const Cities = require('./data/cities.json');

function createDistrictsFile(citiesList, index) {
  index = index || 0;

  const cityItem = citiesList[index];

  if (cityItem) {
    console.log(Chalk.cyan(`${ cityItem.name } iline ait ilçeler kaydediliyor..`));
  }

  if (index >= citiesList.length) {
    console.log(Chalk.green(`Tüm illerin ilçeleri kaydedildi!`));
    return;
  }

  Axios
    .get(`https://www.sehirlersavasi.com/ilce-resimleri/index.asp?il=${ cityItem.id }`)
    .then(function(response) {
      var tpl = response.data.replace(/\n/g, '');

      var RegexpsDistrictList = /<a href="index\.asp\?il=(.*?)&ilce=(.*?)" title="(.*?) Resimleri" class="mm" >(.*?)/g;
      var RegexpsDistrictListSingle = /<a href="index\.asp\?il=(.*?)&ilce=(.*?)" title="(.*?) Resimleri" class="mm" >(.*?)/;

      var ResultDistrictList = tpl.match(RegexpsDistrictList);

      var DistrictJson = {
        items: []
      };

      ResultDistrictList.map(function(item) {
        var ResultDistrictListItem = item.match(RegexpsDistrictListSingle);
        var district_id = ResultDistrictListItem[2];
        var name = ResultDistrictListItem[3];

        DistrictJson.items.push({
          city_id: cityItem.id,
          city_name: cityItem.name,
          id: district_id,
          name: name
        });
      });

      const cityNamePath = Path.join('data', cityItem.name.toLowerCase());
      if (!Fs.existsSync(cityNamePath)) {
        Fs.mkdirSync(cityNamePath);
      }

      Fs.writeFileSync(Path.join(__dirname, cityNamePath, 'districts.json'), JSON.stringify(DistrictJson));
      console.log(Chalk.green(`${ cityItem.name } ilçeleri kaydedildi!`));

      createDistrictsFile(citiesList, index + 1);

    });
}

createDistrictsFile(Cities.items);
