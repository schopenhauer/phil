const osmosis = require('osmosis');
const moment = require('moment');
const EventEmitter = require('events');
const emitter = new EventEmitter();
const equal = require('deep-equal');
const chalk = require('chalk');

const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const url = 'https://www.philharmonie.lu/en/programm?page=1&a=';
const frequency = 3600 * 24;

let events = [];
let previousEvents;

let stop = false;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
  if (!stop || events.length == 0) {
    res.status(503).send({
      status: 'loading',
    });
  } else {
    res.status(200).send({
      status: 'success',
      events: events,
    });
  }
});

app.get('/page/:page', function (req, res) {
  let page = req.params.page || 1;
  fetch(url.replace('page=1', 'page=' + page) + today(), (events) => {
    res.status(200).send(events);
  });
});

const server = app.listen(3000, function () {
  console.log(`Server running on port ${server.address().port}.`);
  fetchAll();
});

function today() {
  return moment().format('YYYY-MM-DD');
}

function fetch(page, cb) {
  let pageEvents = [];
  console.log(chalk.yellow(`Parsing page ${page}...`));
  osmosis
    .get(url.replace('page=1', 'page=' + page) + today())
    .find('li')
    .set({
      'title': 'div.description a.eventlink h2',
      'type': 'div.description a.eventlink span.location',
      'description': 'div.description div.desc',
      'date': 'div.description a.eventlink span.date',
      'status': 'div.description a.eventlink span.status',
      'image': ['img@src'][0],
    })
    .data(function (event) {
      let d = event.date;
      let date = moment(d.substr(6, 4) + '-' + d.substr(3, 2) + '-' + d.substr(0, 2))
      let datetime = date.hour(d.substr(11, 2)).minute(d.substr(14, 2));
      event.date = datetime.toJSON();
      event.image = 'https://www.philharmonie.lu' + event.image;
      pageEvents.push(event);
    })
    //.log(console.log)
    //.error(console.log)
    //.debug(console.log)
    .done(() => {
      console.log(' > Found %s events.', pageEvents.length);
      cb(null, pageEvents);
    });
}

emitter.on('fetch', function (page) {
  fetch(page,
    (err, newEvents) => {
      stop = equal(previousEvents, newEvents);
      if (stop) {
        console.log(` > Fetch stops at page ${page}, because duplicates were found.`);
        console.log(chalk.bgGreen('Fetching... done.'));
      } else {
        events = [...events, ...newEvents];
        previousEvents = newEvents;
      }
      if (newEvents.length > 0 && !stop) {
        emitter.emit('fetch', page + 1);
      }
    }
  );
});

function fetchAll() {
  events = [];
  console.log(chalk.bgYellow('Fetching...'));
  emitter.emit('fetch', 1);
}

setInterval(() => {
  fetchAll();
}, frequency);
