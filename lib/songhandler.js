// [2] Sets the handle up
SongHandler = function() {
  this.songinformation = [];
  console.log("[SongHandler] SONGHANDLER called.");
};

// [3] Expands the Object with functions
SongHandler.prototype = {
  clear: function() {
    this.songinformation = [];
    console.log("SongHandler cleared!");
  },
  initFirstList: function(songlist) {
    console.log("[SongHandler-initFirstList]");
    for(i in songlist) {
      this.songinformation.push({songinfo: songlist[i], upvotes: 0});
    }
    this.printArray();
  },
  // Outputs the current state of the songhandler
  printArray: function() {
    console.log("[SongHandler-printArray]");
    console.log(this.songinformation);
  },
  // Adds song to array if it doesn't exist already.
  addValue: function(songid, song, cb) {
    console.log("[SongHandler-addValue] " + songid + " -> " + song);
    var bExistsAlready = false;

    // Iterate over all entries
    for (i in this.songinformation) {
      if (song == this.songinformation[i].song) {
        bExistsAlready = true;
        if (this.songinformation[i].upvotes < 254) {
          this.songinformation[i].upvotes += 1;
        }
        console.log(song + "[" + this.songinformation[i].songid + "]" + " ALREADY THERE with [" + this.songinformation[i].upvotes + "] votes !!");
        cb(this.songinformation[i].upvotes, songid);
        break;
      }
    }
    if (!bExistsAlready) {
      this.songinformation.push({songid: songid, song: song, upvotes: 1});
      cb(1, songid);
      console.log("New Record: " + song + " -> ID: [" + songid + "]");
    }
  },
  // An example function with a return value
  returnsomething: function(song, cb) {
    return cb();
  },
  dotheCallback: function(data, cb) {
    console.log("DoTheCallback with " + data);
    return cb(data);
  }
};

// [1] This creates a new handle
function createHandler() {
  console.log("[SongHandler] CREATEHANDLER called");
  // Returns songHandler = function() (Check the beginning of this file for further information)
  return new SongHandler();
}

exports = module.exports = createHandler;
