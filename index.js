const request = require('request-promise');
const seedrandom = require('seedrandom');
const RSS = require('rss');

const express = require('express');

const app = express();

const MS_IN_DAY = 24 * 60 * 60 * 1000;

app.get('/', function (req, res) {
  res.redirect(`/en_US.atom`);
});

app.get('/:locale.atom', function (req, res) {
  request(`http://ebird.org/ws1.1/ref/taxa/ebird?fmt=json&locale=${req.locale}`, {
    json: true
  }).then((birds) => {
    const today = Math.floor(new Date().getTime() / MS_IN_DAY) * MS_IN_DAY;
    const days = [...Array(30).keys()].map((i) => {
      return today - i * MS_IN_DAY;
    }).map((day) => {
      return {
        date: new Date(day),
        bird: birds[Math.floor(birds.length * seedrandom(day)())]
      };
    });
    res.set('Content-Type', 'text/xml');
    res.send(formatRSS(days));
  }).catch(e => {
    console.log(e);
    res.sendStatus(500);
  });
});

app.listen(3000, function () {
  console.log('Random Bird listening on port 3000!');
});

function formatRSS(birds) {
  var feed = new RSS({
    title: `Birds`
  });
  birds.forEach((item) => {
    feed.item({
      title: `${item.bird.comName} (${item.bird.sciName})`,
      url: `https://ebird.org/species/${item.bird.speciesCode}`,
      guid: `https://ebird.org/species/${item.bird.speciesCode}`,
      date: item.date
    });
  });
  return feed.xml();
}
