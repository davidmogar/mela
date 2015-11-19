var currentTask;
var inBreak = false;
var tasks = [];
var timerWorker = new Worker("js/timer-worker.js");

timerWorker.onmessage = function(e) {
  if (e.data.finished) {
    if (!inBreak) {
      showNotification((tasks.shift()).description);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      $('#previous-tasks ol li:first-child').remove();
      updateListNumbering();
    }

    inBreak = false;

    if (tasks.length > 0) {
      showTimerControls();
    } else {
      timerWorker.terminate();
      showFinishMessage();
    }
  }

  $('section#timer-panel p.timer').text(e.data.time);
}

$(function() {
  Notification.requestPermission();

  $('section#break-panel form').on('submit', function(e) {
    e.preventDefault();

    inBreak = true;

    $('section#timer-panel p.task').text('Break');
    hideBreakPanel();
    timerWorker.postMessage($("section#break-panel .timer-duration").val());
    showTimerPanel();
  });

  $('section#form-panel form').on('submit', function(e) {
    e.preventDefault();

    createTask($("#task-description").val(), $("section#form-panel .timer-duration").val());
    resetInputValues();
  });

  $('input.timer-duration').on('input change', function() {
    var value = $(this).val();
    $(this).siblings('.duration-label').children('span').text(value + (value > 1? ' minutes' : ' minute'));
  });

  $('button#start').click(function() {
    $('section#form-panel').addClass('hide');
    $('section#timer-panel').removeClass('hide');
    beginTask(tasks[0]);
  });

  $('#controls button.break').click(function() {
    hideTimerControls();
    hideTimerPanel();
    showBreakPanel();
  });

  $('#controls button.next').click(function() {
    beginTask(tasks[0]);
    hideTimerControls();
  });

  $(document.body).on('click', 'span.delete', function() {
    deleteTask($(this));
  });

  if (storageAvailable('localStorage')) {
    loadPreviousTasks();
  }

});

function beginTask(task) {
  $('section#timer-panel p.task').text(task.description);
  timerWorker.postMessage(task.duration);
}

function createListElement(index, description, duration) {
  return '<li><span class="number">' + index + '.</span>' + description + ' for ' +
      duration + ' minutes<span class="delete">Delete</span></li>';
}

function createTask(description, duration) {
  currentTask = description;
  $('#previous-tasks ol').append(createListElement(tasks.length + 1,
      description, duration));

  if (storageAvailable('localStorage')) {
    tasks.push({ description: description, duration: duration });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
}

function deleteTask(element) {
  var index = element.siblings('span.number').text().substring(0, -1);
  tasks.splice(index - 1, 1);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  element.closest('li').remove();
  updateListNumbering();
}

function hideBreakPanel() {
  $('section#break-panel').addClass('hide');
}

function hideTimerPanel() {
  $('section#timer-panel').addClass('hide');
}

function hideTimerControls() {
  $('#controls').removeClass('show');
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
      $(element).text((index + 1) + '.');
    });
}

function resetInputValues() {
  $('section#break-panel input.timer-duration').val(4);
  $('section#break-panel .duration-label span').text('4 minutes');
  $('section#form-panel input.timer-duration').val(13);
  $('section#form-panel .duration-label span').text('13 minutes');
  $('#task-description').val('');
}

function showBreakPanel() {
  resetInputValues();
  $('section#break-panel').removeClass('hide');
}

function showFinishMessage() {
  $('section#timer-panel p.task').text('You have completed all your tasks.');
  $('section#timer-panel p.timer').text('Congratulations!');
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

function showTimerControls() {
  $('#controls').addClass('show');
}

function showTimerPanel() {
  resetInputValues();
  $('section#timer-panel').removeClass('hide');
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
