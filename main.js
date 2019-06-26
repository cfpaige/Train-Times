require('dotenv').config()

var firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  databaseURL: DB_URL,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: SENDER_ID,
  appId: APP_ID
};

firebase.initializeApp(firebaseConfig);

var database = firebase.database();


$("#add-train-btn").on("click", function (event) {
  event.preventDefault();

  var trainName = $("#train-name-input").val().trim();
  var trainDest = $("#train-dest").val().trim();
  var firstTrVal = moment($("#first-train").val().trim(), "HHmm")
  var firstTrain = firstTrVal.format("HH:mm");
  var trainFreq = $("#train-freq").val().trim();

  var newTrain = {
    name: trainName,
    dest: trainDest,
    first: firstTrain,
    freq: trainFreq
  };

  database.ref().push(newTrain);

  $("#train-name-input").val("");
  $("#train-dest").val("");
  $("#first-train").val("");
  $("#train-freq").val("");
});

var timeNow = new moment().format("HH:mm");

database.ref().on("child_added", function (childSnapshot) {

  var trainName = childSnapshot.val().name;
  var trainDest = childSnapshot.val().dest;
  var firstTrain = childSnapshot.val().first;
  var trainFreq = childSnapshot.val().freq;

  // split, parse, sum minutes:
  function sps(timeHrMin) {
    var splitHrMin = timeHrMin.split(":");
    var splitHrNum = parseInt(splitHrMin[0]);
    var splitMinNum = parseInt(splitHrMin[1]);
    return splitHrNum * 60 + splitMinNum;
  }

  // assuming no trains after midnight (=0) until first train of new date:
  function minsAway() {
    if (sps(timeNow) <= sps(firstTrain)) {
      return (sps(firstTrain) - sps(timeNow))
    } else {
      return (trainFreq - ((sps(timeNow) - sps(firstTrain)) % trainFreq))
    }
  }

  var nextTrHrs = parseInt((sps(timeNow) + minsAway()) / 60);
  var nextTrMins = (sps(timeNow) + minsAway()) % 60;

  function train12hr() {
    var h = nextTrHrs;
    var m = nextTrMins;
    m = m < 10 ? '0' + m : m;
    if (h > 0 && h < 12) {
      return(`${h}.${m}` + " AM");
    }
    if (h == 12) {
      return(`${h}.${m}` + " PM");
    } 
    if (h == 0 || h == 24) {
      hPlus = 12;
      return(`${hPlus}.${m}` + " AM");
    }
    if(h > 12) {
      hMinus = h - 12;
      return(`${hMinus}.${m}` + " PM");
    }
  }

  function firstTr12() {
    var firstSplit = firstTrain.split(":");
    if (firstSplit[0] > 0 && firstSplit[0] < 12) {
      return(`${firstSplit[0]}.${firstSplit[1]}` + " AM");
    }
    if (firstSplit[0] == 12) {
      return(`${firstSplit[0]}.${firstSplit[1]}` + " PM");
    }
    if (firstSplit[0] == 0 || firstSplit[0] == 24) {
      firstSplitAm = 12;
      return(`${firstSplitAm}.${firstSplit[1]}` + " AM");
    } 
    if(firstSplit[0] > 12 && firstSplit[0] < 24) {
      firstSplitPm = firstSplit[0] - 12;
      return(`${firstSplitPm}.${firstSplit[1]}` + " PM");
    }
  }

  function nextTrain() {
    if (sps(timeNow) == sps(firstTrain)) {
      return "Leaving now";
    }
    if (sps(timeNow) < sps(firstTrain)) {
      return(firstTr12());
    }
    if (sps(timeNow) > sps(firstTrain)) {
      return(train12hr());
    }
  }

  var newRow = $("<tr>").append(
    $("<td>").text(trainName),
    $("<td>").text(trainDest),
    $("<td>").text(trainFreq),
    $("<td>").text(nextTrain()),
    $("<td>").text(minsAway())
  );

  $("#train-table > tbody").append(newRow)
});