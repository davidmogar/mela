var currentTask;
var tasks = [];
var timerWorker = new Worker("js/timer-worker.js");

timerWorker.onmessage = function(e) {
  if (e.data.finished) {
    showNotification((tasks.shift()).description);
    $('#previous-tasks ol li:first-child').remove();
    updateListNumbering();
  }
  $("#timer").text(e.data.time);
}

$(function() {
  Notification.requestPermission();

  $('form').on('submit', function(e) {
    e.preventDefault();

    createTask($("#task-description").val(), $("#task-duration").val());
    $("#task-description").val('');
    $("#task-duration").val(13);
  });

  $('#task-duration').on('input change', function() {
    var value = $(this).val();
    $('#duration-label span').text(value + (value > 1? ' minutes' : ' minute'));
  });

  $(document.body).on('click', 'span.delete', function() {
    console.log('hola');
    deleteTask($(this));
  });

  if (storageAvailable('localStorage')) {
    loadPreviousTasks();
  }

});

function createListElement(index, description, duration) {
  return '<li><span class="number">' + index + '</span>.' + description + ' for ' +
      duration + ' minutes<span class="delete">Delete</span></li>';
}

function createTask(description, duration) {
  currentTask = description;
  $('#previous-tasks ol').append(createListElement(tasks.length + 1,
      description, duration));

  timerWorker.postMessage(duration);

  if (storageAvailable('localStorage')) {
    tasks.push({ description: description, duration: duration });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
}

function deleteTask(element) {
  var index = element.siblings('span.number').text();
  tasks.splice(index - 1, 1);
  element.closest('li').remove();
  updateListNumbering();
}

function loadPreviousTasks() {
  if (localStorage.getItem('tasks')) {
    tasks = JSON.parse(localStorage.getItem('tasks'));

    for (var i = 0; i < tasks.length; i++) {
      $("#previous-tasks ol").append(createListElement(i + 1,
          tasks[i].description, tasks[i].duration));
    }
  }
}

function updateListNumbering() {
    $('#previous-tasks ol span.number').each(function(index, element) {
      $(element).text(index + 1);
    });
}

function showNotification(task) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      var notification = new Notification('Time for a change!', {
        body: '\'' + task + '\' task hava finished.',
        icon: '../img/mela.png',
        vibrate: [200, 100, 200]
      });

      setTimeout(function() { notification.close(); }, 5000);
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
