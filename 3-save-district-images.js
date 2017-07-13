const Axios = require('axios');
const Chalk = require('chalk');
const Fs = require('fs');
const Path = require('path');
const Url = require('url');

const Cities = require('./data/cities.json');

function pDownload(url, dest) {
  var file = Fs.createWriteStream(dest);

  return new Promise((resolve, reject) => {
    let responseSent = false;
    const options = {
      method: 'get',
      url: url,
      responseType: 'stream'
    };

    Axios(options)
      .then(function(response) {
        response.data.pipe(file);

        file.on('finish', function() {
          file.close(function() {
            if (responseSent) {
              return;
            }
            responseSent = true;
            resolve();
          });
        });
      })
      .catch(function(err) {
        if (responseSent) {
          return;
        }
        responseSent = true;
        resolve(err);
      });
  });
}

function getDistrictImages(citiesList, index) {
  index = index || 0;

  if (index >= citiesList.length) {
    return;
  }

  const cityItem = citiesList[index];
  const districtFilePath = Path.join(__dirname, 'data', cityItem.name.toLowerCase(), 'districts.json');
  const Districts = require(districtFilePath);
  saveDistrictImages(citiesList, index, Districts.items);
}

function saveDistrictImages(cityList, cityIndex, districtList, districtIndex) {
  index = districtIndex || 0;

  const districtItem = districtList[index];

  if (districtItem) {
    console.log(Chalk.cyan(`${ districtItem.city_name } ${ districtItem.name } ilçesine ait resimler kaydediliyor..`));
  }

  if (index >= districtList.length) {
    console.log(Chalk.green(`Tüm ilçelerin resimleri kaydedildi!`));
    getDistrictImages(cityList, cityIndex + 1);
    return;
  }


  Axios
    .get(`https://www.sehirlersavasi.com/ilce-resimleri/index.asp?il=${ districtItem.city_id }&ilce=${ districtItem.id }`)
    .then(function(response) {
      const tpl = response.data.replace(/\n/g, '');

      const RegexpsImagesList = /<img width="100" height="100" src="(.*?)" alt="(.*?)"/g;
      const RegexpsImagesListSingle = /<img width="100" height="100" src="(.*?)" alt="(.*?)"/;

      const ResultImagesList = tpl.match(RegexpsImagesList);
      const imageDownloadRequests = [];

      const cityNamePath = Path.join('data', districtItem.city_name.toLowerCase());
      if (!Fs.existsSync(cityNamePath)) {
        Fs.mkdirSync(cityNamePath);
      }

      const districtNamePath = Path.join(cityNamePath, districtItem.name.toLowerCase());
      if (!Fs.existsSync(districtNamePath)) {
        Fs.mkdirSync(districtNamePath);
      }

      if (ResultImagesList && ResultImagesList.length > 0) {
        ResultImagesList.map(function(item) {
          const ResultImagesListItem = item.match(RegexpsImagesListSingle);
          const imageUrl = ResultImagesListItem[1];

          const parsed = Url.parse(imageUrl);
          const filename = Path.basename(parsed.pathname);

          imageDownloadRequests.push(pDownload(imageUrl, Path.join(__dirname, districtNamePath, filename)));
        });

        Axios.all(imageDownloadRequests)
          .then(function(allResponses) {
            console.log(Chalk.green(`${ districtItem.city_name } ${ districtItem.name } ilçesine ait tüm resimler kaydedildi!`));
            saveDistrictImages(cityList, cityIndex, districtList, index + 1);
          });
      } else {
        saveDistrictImages(cityList, cityIndex, districtList, index + 1);
      }
    });

}

getDistrictImages(Cities.items);
