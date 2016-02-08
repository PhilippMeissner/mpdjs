var _ = require('lodash');

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
      this.songinformation.push({songid: songlist[i], upvotes: 0, userids: []});
    }
    this.printArray();
  },
  // Outputs the current state of the songhandler
  printArray: function() {
    console.log("[SongHandler-printArray]:");
    console.log(this.songinformation);
  },
  // Adds song to array if it doesn't exist already.
  addValue: function(songid, userid, cb) {
    console.log("[SongHandler-addValue] -> " + songid + " by " + userid);

    var bExistsAlready      = false;

    // Iterate over all entries
    for (i in this.songinformation) {
      // Song is included already, so has already votes.
      if (songid == this.songinformation[i].songid) {
        bExistsAlready = true;
        for(user in this.songinformation[i].userids) {
          // User has already voted!
          if (userid == this.songinformation[i].userids[user]) {
            //userHasAlreadyVoted = true;
            console.log("User[" + userid + "] already voted for this song!");
            return;
          }
        }

        // MPD allows a priority from 0..255
        if (this.songinformation[i].upvotes <= 254) {
          this.songinformation[i].upvotes += 1;
          this.songinformation[i].userids.push(userid);
          console.log(this.songinformation[i]);
        }
        console.log("["+ songid + "] already has " + this.songinformation[i].upvotes + " votes.");
        cb(this.songinformation[i].upvotes, songid);
        break;
      }
    }
    if (!bExistsAlready) {
      this.songinformation.push({songid: songid, upvotes: 1, userids: [userid]});
      cb(1, songid);
      console.log("Neuer Eintrag für ID: " + songid + " von User " + userid);
    }
    console.log("New list: ");
    this.printArray();
  },
  removeValue: function(songid) {
    // Find entry and delete it from Array.
    var index = _.findIndex(this.songinformation, {songid: songid});
    if (index != -1) {
      console.log("Deleting entry at " + index + " with songid: " + this.songinformation[index].songid);
      this.songinformation.splice(index, 1);
      //this.printArray();
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
