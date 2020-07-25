const request = require('request-promise');
const seedrandom = require('seedrandom');
const RSS = require('rss');

const MS_IN_DAY = 24 * 60 * 60 * 1000;

module.exports = (req, res) => {
  request(`http://ebird.org/ws1.1/ref/taxa/ebird?fmt=json&locale=${req.query.locale}`, {
    json: true
  }).then((birds) => {
    const today = Math.floor(new Date().getTime() / MS_IN_DAY) * MS_IN_DAY;
    return Promise.all([...Array(30).keys()].map((i) => {
      return today - i * MS_IN_DAY;
    }).map((day) => {
      const bird = birds[Math.floor(birds.length * seedrandom(day)())];
      return request(`https://ebird.org/media/catalog.json?searchField=species&q=${bird.comName}&taxonCode=${bird.speciesCode}&_mediaType=on&mediaType=p&view=List&sort=rating_rank_desc&_req=on&count=5`, {
        json: true
      }).then((images) => {
        return {
          date: new Date(day),
          bird,
          images: images.results.content
        };
      });
    }));
  }).then((birds) => {
    res.setHeader('Content-Type', 'text/xml');
    res.send(formatRSS(birds));
  })
  .catch(e => {
    console.log(e);
    res.sendStatus(500);
  });
};

function formatRSS(birds) {
  var feed = new RSS({
    title: `Random Bird Images - Daily`,
    custom_namespaces: {
      'media': 'http://search.yahoo.com/mrss/'
    },
  });
  birds.forEach((item) => {
    feed.item({
      title: `${item.bird.comName} (${item.bird.sciName})`,
      url: `https://ebird.org/species/${item.bird.speciesCode}`,
      guid: `https://ebird.org/species/${item.bird.speciesCode}`,
      date: item.date,
      custom_elements: item.images.length === 0 ? [] : [{
        'media:content': {
          _attr: {
            url: item.images[0].largeUrl
          }
        }
      }, {
        'media:credit': item.images[0].userDisplayName
      }]
    });
  });
  return feed.xml();
}
