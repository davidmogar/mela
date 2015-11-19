const NOTIFICATION_DURATION = 5000;
const LOCAL_STORAGE_AVAILABLE = isStorageAvailable('localStorage');

var inBreak = false;
var tasks = [];
var timerWorker;

$(function() {
  Notification.requestPermission();
  
  createTimerWorker();
  loadPreviousTasks();

  /* Starts a break for the defined duration on form submit. */
  $('section#break-panel form').on('submit', function(e) {
    e.preventDefault();

    inBreak = true;

    $('section#timer-panel p.task').text('Break');
    timerWorker.postMessage($("section#break-panel .timer-duration").val());
    hidePanel('break');
    showPanel('timer');
    resetForms();
  });

  /* Creates a task on form submit. */
  $('section#task-creation-panel form').on('submit', function(e) {
    e.preventDefault();
    createTask($("#task-description").val(),
        $("section#task-creation-panel .timer-duration").val());
    resetForms();
  });

  /* Shows slider value every time an input range change. */
  $('input.timer-duration').on('input change', function() {
    var value = $(this).val();
    $(this).siblings('.duration-label').children('span').text(value + (value > 1? ' minutes' : ' minute'));
  });

  /* Begins next task on 'start' button click. */
  $('button#start').click(function() {
    hidePanel('task-creation');
    showPanel('timer');
    beginNextTask(tasks[0]);
  });

  /* Show break controls on 'break' button click. */
  $('#controls button.break').click(function() {
    hideTimerControls();
    hidePanel('timer');
    showPanel('break');
  });

  /* Begins next task on 'next' button click */
  $('#controls button.next').click(function() {
    beginNextTask(tasks[0]);
    hideTimerControls();
  });

  /* Deletes a list element if its 'delete' button is clicked. */
  $(document.body).on('click', 'span.delete', function() {
    deleteTask($(this));
  });
});

/**
 * Append a new element to previous tasks list.
 */
function appendListElement(index, description, duration) {
  var list = $('#previous-tasks-panel ol');
  var durationText = ' for ' + duration + (duration > 1? ' minutes' : ' minute');
  list.append('<li><span class="number">' + index + '.</span>' +
      description + durationText + '<span class="delete">Delete</span></li>');
}

/**
 * Begins the next task on the list (if any).
 */
function beginNextTask() {
  if (tasks.length > 0) {
    $('section#timer-panel p.task').text(tasks[0].description);
    timerWorker.postMessage(tasks[0].duration);
  }
}

/**
 * Creates a new task with the given description and duration.
 * The new task is saved in the local storage and added to the ol list.
 */
function createTask(description, duration) {
  appendListElement(tasks.length + 1, description, duration);

  if (LOCAL_STORAGE_AVAILABLE) {
    tasks.push({ description: description, duration: duration });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
}

/**
 * Creates the timer worker that will be used to control tasks duration.
 */
function createTimerWorker() {
  timerWorker = new Worker("js/timer-worker.js");

  timerWorker.onmessage = function(e) {
    if (e.data.finished) {
      if (!inBreak) {
        markCurrentTaskComplete();
      } else {
        inBreak = false;
      }

      if (tasks.length > 0) {
        showTimerControls();
        setTimerToZero();
      } else {
        timerWorker.terminate();
        showFinishMessage();
      }
    } else {
      $('section#timer-panel p.timer').text(e.data.time);
    }
  }
}

/**
 * Deletes a task given its list element.
 */
function deleteTask(element) {
  var index = element.siblings('span.number').text().substring(0, -1);
  tasks.splice(index - 1, 1);
  element.closest('li').remove();
  updateListIndexes();

  if (LOCAL_STORAGE_AVAILABLE) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
}

/**
 * Hides the panel with the given name.
 */
function hidePanel(name) {
  $('section#' + name + '-panel').addClass('hide');
}

/**
 * Hides timer controls.
 */
function hideTimerControls() {
  $('#controls').removeClass('show');
}

/**
 * Checks if localStorage is available.
 */
function isStorageAvailable(type) {
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

/**
 * Loads previous tasks and add them to the list.
 */
function loadPreviousTasks() {
  if (LOCAL_STORAGE_AVAILABLE && localStorage.getItem('tasks')) {
    tasks = JSON.parse(localStorage.getItem('tasks'));

    for (var i = 0; i < tasks.length; i++) {
      appendListElement(i + 1, tasks[i].description, tasks[i].duration);
    }
  }
}

/**
 * Marks the first (current) task complete */
function markCurrentTaskComplete() {
  showNotification((tasks.shift()).description);
  $('#previous-tasks-panel ol li:first-child').remove();
  updateListIndexes();

  if (LOCAL_STORAGE_AVAILABLE) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
}

/**
 * Resets forms components to default values.
 */
function resetForms() {
  $('section#break-panel input.timer-duration').val(4);
  $('section#break-panel .duration-label span').text('4 minutes');
  $('section#task-creation-panel input.timer-duration').val(13);
  $('section#task-creation-panel .duration-label span').text('13 minutes');
  $('#task-description').val('');
}

/**
 * Sets timer to zero.
 */
function setTimerToZero() {
  $('section#timer-panel p.timer').text('00:00');
}

/**
 * Shows a finish message. This method is invoked once all task are completed.
 */
function showFinishMessage() {
  $('section#timer-panel p.task').text('You have completed all your tasks.');
  $('section#timer-panel p.timer').text('Congratulations!');
  showPanel('timer'); // Just in case
}

/**
 * Shows a notification panel for the given task.
 */
function showNotification(task) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      var notification = new Notification('Time for a change!', {
        body: '\'' + task + '\' task hava finished.',
        icon: '../img/mela.png',
        vibrate: [200, 100, 200]
      });

      setTimeout(function() { notification.close(); }, NOTIFICATION_DURATION);
    }
  }
}

/**
 * Shows the panel with the given name.
 */
function showPanel(name) {
  $('section#' + name + '-panel').removeClass('hide');
}

/**
 * Shows timer controls.
 */
function showTimerControls() {
  $('#controls').addClass('show');
}

/**
 * Update list elements indexes.
 */
function updateListIndexes() {
  $('#previous-tasks-panel ol span.number').each(function(index, element) {
    $(element).text((index + 1) + '.');
  });
}
