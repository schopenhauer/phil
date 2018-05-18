# phil

This is a missing API for the Philharmonie Luxembourg. Enjoy the events.

<img src="https://www.philharmonie.lu/media/images/logo_plux.png">

## Usage

Run the server.

```
npm install
node app.js
```

Then, issue the following GET request to fetch events.

```
curl http://localhost:3000          # all events
curl http://localhost:3000/page/1   # selected page
```

## To do

* Caching with Redis/Memcache
