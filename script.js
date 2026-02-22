(function () {
  const DURATION_SEC = 90;
  const YOUTUBE_VIDEO_ID = "1yvkX7iXabg";

  const meditationScreen = document.getElementById("meditationScreen");
  const doneScreen = document.getElementById("doneScreen");
  const lockinBtn = document.getElementById("lockinBtn");
  const continueBtn = document.getElementById("continueBtn");
  const meditationText = document.getElementById("meditationText");
  const meditationTimer = document.getElementById("meditationTimer");

  let ytPlayer = null;
  let ytReady = false;
  let pendingPlay = false;
  let countdownInterval = null;

  function startYouTube() {
    if (ytReady && ytPlayer) {
      ytPlayer.setVolume(70);
      ytPlayer.playVideo();
    } else {
      pendingPlay = true;
    }
  }

  function stopYouTube() {
    pendingPlay = false;
    if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function startLockIn() {
    meditationScreen.classList.add("is-active");
    meditationScreen.setAttribute("aria-hidden", "false");
    doneScreen.classList.remove("is-active");
    doneScreen.setAttribute("aria-hidden", "true");

    startYouTube();

    let remaining = DURATION_SEC;
    meditationTimer.textContent = formatTime(remaining);

    countdownInterval = setInterval(() => {
      remaining -= 1;
      meditationTimer.textContent = formatTime(remaining);
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        meditationText.textContent = "You're ready.";
        stopYouTube();
        setTimeout(() => {
          meditationScreen.classList.remove("is-active");
          meditationScreen.setAttribute("aria-hidden", "true");
          doneScreen.classList.add("is-active");
          doneScreen.setAttribute("aria-hidden", "false");
        }, 800);
      }
    }, 1000);
  }

  function onContinue() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    stopYouTube();
    doneScreen.classList.remove("is-active");
    doneScreen.setAttribute("aria-hidden", "true");
    meditationScreen.classList.remove("is-active");
    meditationScreen.setAttribute("aria-hidden", "true");
    meditationText.textContent = "Breathe";
  }

  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player("youtubePlayer", {
      height: "1",
      width: "1",
      videoId: YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: function () {
          ytReady = true;
          if (pendingPlay) {
            ytPlayer.setVolume(70);
            ytPlayer.playVideo();
            pendingPlay = false;
          }
        },
      },
    });
  };

  lockinBtn.addEventListener("click", startLockIn);
  continueBtn.addEventListener("click", onContinue);
})();
