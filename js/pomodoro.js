var tasks = [];
var timerWorker = new Worker("js/timer-worker.js");
timerWorker.onmessage = function(e) {
  if (e.data.finished) {
    console.log('finished');
  }
  $("#timer").text(e.data.time);
}

$(function() {

  $('form').on('submit', function(e) {
    e.preventDefault();

    createTask($("#task-description").val(), $("#task-duration").val());
  });

  if (storageAvailable('localStorage')) {
    loadPreviousTasks();
  }

});

function createTask(description, duration) {
  $("#previous-tasks ul").append("<li>" + description + " for " +
      duration + " minutes");

  console.log("Message to worker");
  timerWorker.postMessage(duration);

  if (storageAvailable('localStorage')) {
    tasks.push({ description: description, duration: duration });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
}

function loadPreviousTasks() {
  if (localStorage.getItem('tasks')) {
    tasks = JSON.parse(localStorage.getItem('tasks'));

    for (var i = 0; i < tasks.length; i++) {
      $("#previous-tasks ul").append("<li>" + tasks[i].description + " for " +
          tasks[i].duration + " minutes");
    }
  }
}

function storageAvailable(type) {
	try {
		var storage = window[type], x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	}
	catch(e) {
		return false;
	}
}
