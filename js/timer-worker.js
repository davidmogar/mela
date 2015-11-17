var interval;

onmessage = function(e) {
  cancelTimeout(interval);
  startTimer(e.data * 60);
}

function startTimer(duration) {
  var start = Date.now(), diff, minutes, seconds;

  function timer() {
    diff = duration - (((Date.now() - start) / 1000) | 0);

    minutes = (diff / 60) | 0;
    seconds = (diff % 60) | 0;

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    postMessage({ finished: false, time: minutes + ':' + seconds });

    if (diff <= 0) {
      cancelTimeout(interval);
      postMessage({ finished: true, time: minutes + ':' + seconds });
    }
  };

  timer();
  interval = setInterval(timer, 1000);
}
