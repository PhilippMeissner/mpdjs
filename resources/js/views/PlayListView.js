/*
* The MIT License (MIT)
*
* Copyright (c) 2012 Richard Backhouse
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

define([
		'jquery',
		'backbone',
		'underscore',
		'models/PlayList',
		'jquerymobile',
		'../uiconfig',
		'./BaseView',
		'../mpd/MPDClient',
		'text!templates/PlayList.html', '../util/MessagePopup', '../../jquery.growl'],
function($, Backbone, _, PlayList, mobile, config, BaseView, MPDClient, template, MessagePopup, growl){
	var View = BaseView.extend({
		events: function() {
		    return _.extend({}, BaseView.prototype.events, {
				"click #back" : function() {
          console.log("[/resources/views/PlayListView.js] back clicked");
					window.history.back();
				},
				"click #previous" : function() {
          console.log("[/resources/views/PlayListView.js] previous clicked");
					this.sendControlCmd("previous");
				},
				"click #next" : function() {
          console.log("[/resources/views/PlayListView.js] next clicked");
					this.sendControlCmd("next");
				},
				"click #playPause" : function() {
          console.log("[/resources/views/PlayListView.js] " + this.state + " clicked");
					if (this.state === "play") {
						this.sendControlCmd("pause");
					} else {
						this.sendControlCmd("play");
					}
				},
				"click #stop" : function() {
          console.log("[/resources/views/PlayListView.js] stop clicked");
					this.sendControlCmd("stop");
				},
				"click #update" : function() {
          console.log("[/resources/views/PlayListView.js] update clicked");
					this.sendControlCmd("update");
				},
				"click #editButton" : "editPlayList",
				"click #randomButton" : "randomPlayList",
				"click #clearButton" : "clearPlayList",
				"click #playingList li" : "removeSong",
				"change #volume" : "changeVolume",
        // This is our event (click) listener for an element
        // with the id of 'test'. Use it for testing.
        "click #test" : "testFunction",
				"click #upvote" : "upvote"
		    });
		},
		initialize: function(options) {
			options.header = {
				title: "Playlist"
			};
			this.volumeSet = false;
			this.constructor.__super__.initialize.apply(this, [options]);
			this.playlist = options.playlist;
			this.template = _.template( template ) ( { playlist: options.playlist.toJSON() } );
			if (config.isDirect()) {
				var statusListener = function(status) {
					this.showStatus(status);
				}.bind(this);
				this.statusListener = statusListener;
				MPDClient.addStatusListener(statusListener);
			} else {
				this._openWebSocket();
			}
		},
		render: function(){
      console.log("[/resources/views/PlayListView.js] render called");
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		},
		editPlayList: function() {
			$("#playingList li").remove();
			if (this.editing) {
				this.editing = undefined;
				$("#editButton").val("Edit");
				$("#editButton").button("refresh");
				this.playlist.each(function(song) {
					// Done editing
					$("#playingList").append('<li id="upvote" data-icon="star"><a data-songid="'+song.get("id")+'" id="' + song.get("file")+'"><p style="white-space:normal">' + song.get("artist") + ' : ' + song.get("title") + '<span class="ui-li-count">' + song.get("time") + '</span></p></a></li>');
				});
			} else {
				this.editing = true;
				$("#editButton").val("Done");
				$("#editButton").button("refresh");
				this.playlist.each(function(song) {
					// Editing
					$("#playingList").append('<li data-icon="minusIcon"><a href="#playlist" id="'+song.get("id")+'"><p style="white-space:normal">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></p></a></li>');
				});
			}
			$("#playingList").listview('refresh');
		},
		randomPlayList: function() {
			if (config.getRandomPlaylistConfig().enabled) {
				var $popUp = $("<div/>").popup({
					dismissible : false,
					theme : "a",
					overlyaTheme : "a",
					transition : "pop"
				}).bind("popupafterclose", function() {
					$(this).remove();
				});
				$popUp.addClass("ui-content");
				$("<h3/>", {
					text : "Random Playlist Type"
				}).appendTo($popUp);

				$("<p/>", {
					text : "Type:"
				}).appendTo($popUp);

				var $select = $("<select/>", {
					id : "type"
				}).appendTo($popUp);

				var $artist = $("<option/>", {
					value : "artist",
				}).appendTo($select);
				$artist.text("By Artist");

				var $album = $("<option/>", {
					value : "album",
				}).appendTo($select);
				$album.text("By Album");

				var $title = $("<option/>", {
					value : "title",
				}).appendTo($select);
				$title.text("By Title");

				var $genre = $("<option/>", {
					value : "genre",
				}).appendTo($select);
				$genre.text("By Genre");

				if (config.getRandomPlaylistConfig().type === "artist") {
					$artist.attr("selected", "true");
				} if (config.getRandomPlaylistConfig().type === "album") {
					$album.attr("selected", "true");
				} if (config.getRandomPlaylistConfig().type === "title") {
					$title.attr("selected", "true");
				} if (config.getRandomPlaylistConfig().type === "genre") {
					$genre.attr("selected", "true");
				}

				$select.selectmenu();

				$("<p/>", {
					text : "Type Value:"
				}).appendTo($popUp);

				$("<input/>", {
					id : "typevalue",
					type : "text",
					value : config.getRandomPlaylistConfig().typevalue,
					autocapitalize: "off"
				}).appendTo($popUp);

				$("<a>", {
					text : "Ok"
				}).buttonMarkup({
					inline : true,
					icon : "check"
				}).bind("click", function() {
					$popUp.popup("close");
					var type = $("#type").find('option:selected').val();
					var typevalue = $("#typevalue").val();
					if (typevalue || typevalue !== "") {
						config.setRandomPlaylistConfig({enabled: true, type: type, typevalue: typevalue});
						this.randomPlayListRequest(type, typevalue);
					}
				}.bind(this)).appendTo($popUp);

				$("<a>", {
					text : "Cancel"
				}).buttonMarkup({
					inline : true,
					icon : "delete"
				}).bind("click", function() {
					$popUp.popup("close");
				}).appendTo($popUp);

				$popUp.popup("open").trigger("create");
			} else {
				this.randomPlayListRequest();
			}
		},
		randomPlayListRequest: function(type, typevalue) {
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				if (type) {
					MPDClient.randomPlayListByType(type, typevalue, function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					MPDClient.randomPlayList(function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				}
			} else {
				var url = config.getBaseUrl()+"/music/playlist/random";
				if (type) {
					url += "/"+type+"/"+encodeURIComponent(typevalue);
				}
				$.ajax({
					url: url,
					type: "PUT",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("random playlist error : "+textStatus);
					}
				});
			}
		},
		clearPlayList: function() {
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				MPDClient.clearPlayList(function() {
					$.mobile.loading("hide");
					this.fetchPlayList();
				}.bind(this));
			} else {
				$.ajax({
					url: config.getBaseUrl()+"/music/playlist",
					type: "DELETE",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("clear playlist error : "+textStatus);
					}
				});
			}
		},
		removeSong: function(evt) {
			if (this.editing) {
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.removeSong(evt.target.id, function() {
						$.mobile.loading("hide");
						this.fetchPlayList();
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/playlist/"+evt.target.id,
						type: "DELETE",
						headers: { "cache-control": "no-cache" },
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
							this.fetchPlayList();
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("remove song error : "+textStatus);
						}
					});
				}
			}
		},
		fetchPlayList: function() {
			$.mobile.loading("show", { textVisible: false });
			this.playlist.fetch({
				success: function(collection, response, options) {
		        	$.mobile.loading("hide");
					this.playlist.reset(collection.toJSON());
					$("#playingList li").remove();
					this.playlist.each(function(song) {
						if (this.editing) {
							$("#playingList").append('<li data-icon="minusIcon"><a href="#playlist" id="'+song.get("id")+'"><p style="white-space:normal">'+song.get("artist")+' : '+song.get("title")+'<span class="ui-li-count">'+song.get("time")+'</span></p></a></li>');
						} else {
							console.log("fetchPlayList re-order playlinglist");
							// Check what PlayList.html uses and copy the layout accordingly.
							$("#playingList").append('<li id="upvote" data-icon="star"><a data-songid="'+song.get("id")+'" id="' + song.get("file")+'"><p style="white-space:normal">' + song.get("artist") + ' : ' + song.get("title") + '<span class="ui-li-count">' + song.get("time") + '</span></p></a></li>');
						}
					}.bind(this));
					$("#playingList").listview('refresh');
				}.bind(this),
				error: function(jqXHR, textStatus, errorThrown) {
		        	$.mobile.loading("hide");
					console.log("fetch playlist error : "+textStatus);
				}
			});
		},
		changeVolume: function() {
			var vol = $("#volume").val();
			if (vol !== this.volume && this.state === "play") {
				$.mobile.loading("show", { textVisible: false });
				if (config.isDirect()) {
					MPDClient.changeVolume(vol, function() {
						$.mobile.loading("hide");
					}.bind(this));
				} else {
					$.ajax({
						url: config.getBaseUrl()+"/music/volume/"+vol,
						type: "POST",
						headers: { "cache-control": "no-cache" },
						contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
						dataType: "text",
						success: function(data, textStatus, jqXHR) {
							$.mobile.loading("hide");
						}.bind(this),
						error: function(jqXHR, textStatus, errorThrown) {
							$.mobile.loading("hide");
							console.log("change volume error: "+textStatus);
						}
					});
				}
      }
		},
    testFunction: function(evt) {
      console.log("[/resources/views/PlayListView.js] testFunction called");
      // Call listAll and pass a callback-function (alert)
			// MessagePopup.createTopRightCorner("Suck it, bitch!");
			$.mobile.loading("show", { textVisible: false });
			if (!config.isDirect()) {
				$.ajax({
					url: config.getBaseUrl() + "/music/test/",
					type: "POST",
					headers: { "cache-control" : "no-cache"},
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					datatype: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
						console.log("Success!");
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("Error: " + textStatus);
					}
				});
			}
      console.log("[/resources/views/PlayListView.js] testFunction finished");
    },
    upvote: function(evt) {
      console.log("[/resources/views/PlayListView.js] upvote called");

			// Get Cookie with key "uuid"
			var cookie="";
    	var nameEQ = "uuid=";
    	var ca = document.cookie.split(';');
    	for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) cookie = c.substring(nameEQ.length,c.length);
    	}

			var songid = $(evt.target).closest("a").data("songid");
			var songinfo = $(evt.target).closest("a").attr("id");

			$.mobile.loading("show", { textVisible: false });
			if (!config.isDirect()) {
				evt.preventDefault();
				$.ajax({
					url: config.getBaseUrl() + "/music/upvote/" + songid + "/" + cookie + "/" + songinfo,
					type: "POST",
					headers: { "cache-control" : "no-cache"},
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					datatype: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
						$.growl.notice({ title: "Voted!", message: "We received your vote for " + songinfo });
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("Error: " + textStatus);
					}
				});
			}
      console.log("[/resources/views/PlayListView.js] upvote finished");
    },
		sendControlCmd: function(type) {
			$.mobile.loading("show", { textVisible: false });
			if (config.isDirect()) {
				MPDClient.sendControlCmd(type, function() {
					$.mobile.loading("hide");
				}.bind(this));
			} else {
				$.ajax({
					url: config.getBaseUrl()+"/music/"+type,
					type: "POST",
					headers: { "cache-control": "no-cache" },
					contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
					dataType: "text",
					success: function(data, textStatus, jqXHR) {
						$.mobile.loading("hide");
					}.bind(this),
					error: function(jqXHR, textStatus, errorThrown) {
						$.mobile.loading("hide");
						console.log("control cmd error: "+textStatus);
					}
				});
			}
		},
		showStatus: function(data) {
			var status;
			//console.log(data);
			/* data = {
					"volume":"-1",
					"repeat":"1",
					"random":"1",
					"single":"0",
					"consume":"0",
					"playlist":"2",
					"playlistlength":"10",
					"mixrampdb":"0.000000",
					"state":"pause",
					"xfade":"1",
					"song":"0",
					"songid":"1",
					"time":"7:101",
					"elapsed":"6.791",
					"bitrate":"192",
					"audio":"44100:24:2",
					"nextsong":"3",
					"nextsongid":"4",
					"currentsong":{
						"artist":"Linkin Park",
						"title":"Wake-",
						"album":"Minutes To Midnight"
					}
				}
			*/
			if (config.isDirect()) {
				status = data;
			} else {
				status = JSON.parse(data);
			}
			this.state = status.state;
			this.volume = status.volume;
			if (status.state === "play") {
				$("#playPause").val('Pause');
				$("#playPause").button('option', {icon : "pauseIcon" });
				$("#playPause").button("refresh");
			} else {
				$("#playPause").val('Play');
				$("#playPause").button('option', {icon : "playIcon" });
				$("#playPause").button("refresh");
			}
			if (status.currentsong && (status.state === "play" || status.state === "pause")) {
				if (!this.volumeSet) {
					var volume = parseInt(status.volume);
					if (volume > -1) {
						$("#volume").val(status.volume);
						$("#volume").slider('refresh');
						this.volumeSet = true;
					}
				}

				// Check if song changed since last query

				if(status.songid != this.lastSong) {
					// Initial start
					if (this.lastSong == "-1") {
						this.lastSong = status.songid;
					} else {
						var removedID = this.lastSong;
						console.log("ID Changed from " + removedID + " to " + status.songid);
						// Call the SongHandler with old value which we need to remove.
						// "Songhandler.removeValue(this.lastSong);"
						$.ajax({
							url: config.getBaseUrl() + "/music/songchanged/" + removedID,
							type: "POST",
							headers: { "cache-control" : "no-cache"},
							contentTypeString: "application/x-www-form-urlencoded; charset=utf-8",
							datatype: "text",
							success: function(data, textStatus, jqXHR) {
								$.mobile.loading("hide");
								console.log("Success!");
							}.bind(this),
							error: function(jqXHR, textStatus, errorThrown) {
								$.mobile.loading("hide");
								console.log("Error: " + textStatus);
							}
						});

						this.lastSong = status.songid;
						// Reload window to update UI (remove old entry from list)
						window.location.reload();
					}
					// lastSong changed --> We tell others about it.
					// Do it like this:
					// Request for mpdHandler -> Songhandler.deleteEntry(songid)
					// MPD does not need to get called, because song gets consumed+priority therefore removed.
					//console.log("ID Changed from " + this.lastSong + " to " + status.songid);
					//this.lastSong = status.songid;
				}





				//console.log(status.currentsong);
        var fullTime = status.time.split(":", 2);
        fullTime = parseInt(fullTime[1]);
        var fullMinutes = Math.floor(fullTime / 60);
        var fullSeconds = fullTime - fullMinutes * 60;
        fullSeconds = (fullSeconds < 10 ? '0' : '') + fullSeconds;
				var time = Math.floor(parseInt(status.elapsed));
				var minutes = Math.floor(time / 60);
				var seconds = time - minutes * 60;
				seconds = (seconds < 10 ? '0' : '') + seconds;
				var playingText = "Playing [" + status.currentsong.artist + " - " +status.currentsong.title + "] " + minutes + ":" + seconds + " / " + fullMinutes + ":" + fullSeconds;
				$("#currentlyPlaying").text(playingText);
			} else {
				$("#currentlyPlaying").text("No song playing.");
			}
		},
		_openWebSocket: function() {
			this.lastSong = "-1";
			if (window.WebSocket) {
				this.ws = new WebSocket(config.getWSUrl());
			} else if (window.MozWebSocket) {
				this.ws = new MozWebSocket(config.getWSUrl());
			} else {
				alert("No WebSocket Support !!!");
			}
		    this.ws.onmessage = function(event) {
		    	this.showStatus(event.data);
      		}.bind(this);
      		this.ws.onerror = function (error) {
  				console.log('WebSocket Error ' + error);
  				this.ws.close();
  				this._openWebSocket();
			}.bind(this);
		},
		close: function() {
			if (config.isDirect()) {
				MPDClient.removeStatusListener(this.statusListener);
			} else {
				this.ws.close();
			}
		}
	});

	return View;
});
