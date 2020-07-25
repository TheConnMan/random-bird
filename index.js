const request = require('request-promise');
const RSS = require('rss');

const express = require('express');

const app = express();

app.get('/', function (req, res) {
  res.redirect(`/en_US.atom`);
});

app.get('/:locale.atom', function (req, res) {
  request(`http://ebird.org/ws1.1/ref/taxa/ebird?fmt=json&locale=${req.locale}`, {
    json: true
  }).then((birds) => {
    res.set('Content-Type', 'text/xml');
    res.send(formatRSS(birds));
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
  return feed.xml();
}
