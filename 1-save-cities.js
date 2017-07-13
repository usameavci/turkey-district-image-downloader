const Axios = require('axios');
const Chalk = require('chalk');
const Fs = require('fs');
const Path = require('path');

Axios
  .get('https://www.sehirlersavasi.com/ilce-resimleri/index.asp')
  .then(function(response) {
    var tpl = response.data.replace(/\n/g, '');

    var RegexpsCityList = /<a href="index\.asp\?il=(.*?)"  title="(.*?) Resimleri" class="solmenu">/g;
    var RegexpsCityListSingle = /<a href="index\.asp\?il=(.*?)"  title="(.*?) Resimleri" class="solmenu">/;

    var ResultCityList = tpl.match(RegexpsCityList);
    var CityJson = {
      items: []
    };

    ResultCityList.map(function(item) {
      var ResultCityListItem = item.match(RegexpsCityListSingle);
      var name = ResultCityListItem[2];
      var id = ResultCityListItem[1];

      CityJson.items.push({
        id: id,
        name: name
      });
    });

    const dataPath = Path.join('data');
    if (!Fs.existsSync(dataPath)) {
      Fs.mkdirSync(dataPath);
    }

    Fs.writeFileSync(Path.join(__dirname, dataPath, 'cities.json'), JSON.stringify(CityJson));

    console.log(Chalk.green(`Tüm iller kaydedildi!`));
  });
