const request = require('request-promise');
const seedrandom = require('seedrandom');
const RSS = require('rss');

const MS_IN_DAY = 24 * 60 * 60 * 1000;

module.exports = (req, res) => {
  request(`http://ebird.org/ws1.1/ref/taxa/ebird?cat=species&fmt=json&locale=${req.query.locale}`, {
    json: true
  }).then((birds) => {
    const today = Math.floor(new Date().getTime() / MS_IN_DAY) * MS_IN_DAY;
    return Promise.all([...Array(30).keys()].map((i) => {
      return today - i * MS_IN_DAY;
    }).map((day) => {
      return {
        date: new Date(day),
        bird: birds[Math.floor(birds.length * seedrandom(day)())]
      };
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
      link: `https://ebird.org/species/${item.bird.speciesCode}`,
      guid: `https://ebird.org/species/${item.bird.speciesCode}`,
      date: item.date
    });
  });
  return feed.xml();
}
