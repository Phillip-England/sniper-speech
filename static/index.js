// client/index.ts
var btn = document.getElementById("record-button");
var transcriptEl = document.getElementById("transcript");
var interimEl = document.getElementById("interim");
var outputContainer = document.getElementById("output-container");
var placeholder = document.getElementById("placeholder");
var statusText = document.getElementById("status-text");
var copyBtn = outputContainer.querySelector("button");
var isRecording = false;
var recognition = null;
var SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognitionCtor) {
  alert("Your browser does not support speech recognition. Try Chrome or Safari.");
} else {
  recognition = new SpeechRecognitionCtor;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.onstart = () => {
    isRecording = true;
    btn.classList.add("is-recording");
    statusText.classList.remove("opacity-0");
    outputContainer.classList.remove("opacity-0", "translate-y-10");
    placeholder.textContent = "Listening...";
  };
  recognition.onend = () => {
    isRecording = false;
    btn.classList.remove("is-recording");
    statusText.classList.add("opacity-0");
    placeholder.textContent = "Tap button to speak...";
    if (transcriptEl.innerText.trim().length > 0) {
      placeholder.classList.add("hidden");
    } else {
      placeholder.classList.remove("hidden");
    }
  };
  recognition.onresult = (event) => {
    let final = "";
    let interim = "";
    for (let i = event.resultIndex;i < event.results.length; ++i) {
      const result = event.results[i];
      if (!result)
        continue;
      const inner = result[0];
      if (!inner)
        continue;
      if (result.isFinal) {
        final += inner.transcript;
      } else {
        interim += inner.transcript;
      }
    }
    if (final) {
      transcriptEl.innerText += final + " ";
    }
    interimEl.innerText = interim;
    if (transcriptEl.innerText || interimEl.innerText) {
      placeholder.classList.add("hidden");
    }
  };
  recognition.onerror = (event) => {
    console.error("Speech Error:", event.error);
    stopRecording();
  };
}
function startRecording() {
  if (recognition)
    recognition.start();
}
function stopRecording() {
  if (recognition)
    recognition.stop();
}
if (btn) {
  btn.addEventListener("click", () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}
if (copyBtn) {
  copyBtn.onclick = null;
  copyBtn.addEventListener("click", () => {
    const text = transcriptEl.innerText;
    if (text) {
      navigator.clipboard.writeText(text);
      const originalText = copyBtn.innerText;
      copyBtn.innerText = "[ COPIED! ]";
      setTimeout(() => {
        copyBtn.innerText = originalText;
      }, 2000);
    }
  });
}
