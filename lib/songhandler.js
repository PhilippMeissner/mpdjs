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
  initFirstList(songlist) {
    console.log("Init of first songlist");
    for(i in songlist) {
      this.songinformation.push({songinfo: songlist[i], upvotes: 0});
    }
  },
  printArray: function() {
    console.log("Songhandler.. Printing...");
    console.log(this.songinformation);
  },
  addValue: function(song) {
    console.log("[SongHandler-addValue] " + song);
    var bExistsAlready = false;

    // Iterate over all entries
    for (i in this.songinformation) {
      if (song == this.songinformation[i].song) {
        bExistsAlready = true;
        this.songinformation[i].upvotes += 1;
        console.log(song + " ALREADY THERE with [" + this.songinformation[i].upvotes + "] votes !!");
        break;
      }
    }
    if (!bExistsAlready) {
      this.songinformation.push({song: song, upvotes: 1});
      console.log("Added new id " + song);
    }
  },
  // An example function with a return value
  returnsomething(song, cb) {
    cb();
    return "Done";
  }
};

// [1] This creates a new handle
function createHandler() {
  console.log("[SongHandler] CREATEHANDLER called");
  // Returns songHandler = function() (Check the beginning of this file for further information)
  return new SongHandler();
}

exports = module.exports = createHandler;
