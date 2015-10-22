mpdjs - Mimabox
=====

Music Player Daemon client written in javascript.

A proxy running on a nodejs server provides the connection to the Music Play Daemon process. The Frontend is written using JQuery/JQuery Mobile/Backbone/Underscore.
JavaScript optimization provided by Zazl (https://github.com/zazl/zazloptimizer). A WebSocket is used to push status updates to the browser.

Install
-------
From git

	git clone https://github.com/PhilippMeissner/mpdjs.git
	cd mpdjs
	npm install

Usage
-----

	node index.js [http port] [MPD hostname] [MPD port] [javascript compression] [MPD password]

e.g

	node index.js 8080 localhost 6600 false mypass

Point browser to http://[host]:[http port]

iOS App
-------

You can install a iOS based version of MPDjs from iTunes via https://itunes.apple.com/in/app/mpdjs/id965553250?mt=8

Original Author
-------
Richard Backhouse
