/// <reference lib="dom" />

// 1. Manually define the missing interfaces to stop TypeScript errors
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface IWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

// 2. Main Logic
const btn = document.getElementById('record-button') as HTMLButtonElement;
const transcriptEl = document.getElementById('transcript') as HTMLParagraphElement;
const interimEl = document.getElementById('interim') as HTMLParagraphElement;
const outputContainer = document.getElementById('output-container') as HTMLDivElement;
const placeholder = document.getElementById('placeholder') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLDivElement;

const copyBtn = outputContainer.querySelector('button') as HTMLButtonElement;

let isRecording: boolean = false;
let recognition: SpeechRecognition | null = null;

// Fix: Use the actual Class, not the Event
const SpeechRecognitionCtor = (window as unknown as IWindow).SpeechRecognition || 
                              (window as unknown as IWindow).webkitSpeechRecognition;

if (!SpeechRecognitionCtor) {
  alert("Your browser does not support speech recognition. Try Chrome or Safari.");
} else {
  recognition = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isRecording = true;
    btn.classList.add('is-recording');
    statusText.classList.remove('opacity-0');

    outputContainer.classList.remove('opacity-0', 'translate-y-10');
    placeholder.textContent = "Listening...";
  };

  recognition.onend = () => {
    isRecording = false;
    btn.classList.remove('is-recording');
    statusText.classList.add('opacity-0');
    placeholder.textContent = "Tap button to speak...";

    if (transcriptEl.innerText.trim().length > 0) {
      placeholder.classList.add('hidden');
    } else {
      placeholder.classList.remove('hidden');
    }
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let final = '';
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      if (!result) continue;

      const inner = result[0];
      if (!inner) continue;

      if (result.isFinal) {
        final += inner.transcript;
      } else {
        interim += inner.transcript;
      }
    }

    if (final) {
      transcriptEl.innerText += final + ' ';
    }
    interimEl.innerText = interim;

    if (transcriptEl.innerText || interimEl.innerText) {
      placeholder.classList.add('hidden');
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error("Speech Error:", event.error);
    stopRecording();
  };
}

function startRecording() {
  if (recognition) recognition.start();
}

function stopRecording() {
  if (recognition) recognition.stop();
}

if (btn) {
  btn.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

if (copyBtn) {
  // Clear old inline listeners if any
  copyBtn.onclick = null; 
  
  copyBtn.addEventListener('click', () => {
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