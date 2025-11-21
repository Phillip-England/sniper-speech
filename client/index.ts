 /// <reference lib="dom" />

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

const btn = document.getElementById('record-button') as HTMLButtonElement;
const transcriptEl = document.getElementById('transcript') as HTMLParagraphElement;
const interimEl = document.getElementById('interim') as HTMLParagraphElement;
const outputContainer = document.getElementById('output-container') as HTMLDivElement;
const placeholder = document.getElementById('placeholder') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLDivElement;
const copyBtn = outputContainer.querySelector('button') as HTMLButtonElement;
const greenDot = document.getElementById('green-dot') as HTMLDivElement;

let isRecording: boolean = false;
let isLogging: boolean = true;
let shouldContinue: boolean = false;

let recognition: SpeechRecognition | null = null;

const SpeechRecognitionCtor = (window as unknown as IWindow).SpeechRecognition || 
							  (window as unknown as IWindow).webkitSpeechRecognition;

const defaultClasses = ['bg-red-600', 'hover:scale-105', 'hover:bg-red-500'];
const recordingClasses = ['bg-red-700', 'animate-pulse', 'ring-4', 'ring-red-900'];

function updateGreenDot() {
	if (isRecording && isLogging) {
		greenDot.classList.remove('opacity-0');
	} else {
		greenDot.classList.add('opacity-0');
	}
}

if (!SpeechRecognitionCtor) {
	alert("Your browser does not support speech recognition. Try Chrome or Safari.");
} else {
	recognition = new SpeechRecognitionCtor();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.lang = 'en-US';

	recognition.onstart = () => {
		isRecording = true;
		
		updateGreenDot();
		
		btn.classList.remove(...defaultClasses);
		btn.classList.add(...recordingClasses);
		
		statusText.classList.remove('opacity-0');
		outputContainer.classList.remove('opacity-0', 'translate-y-10');
		placeholder.textContent = "Listening...";
	};

	recognition.onend = () => {
		if (shouldContinue) {
			recognition?.start();
			return; 
		}

		isRecording = false;
		updateGreenDot();
		
		btn.classList.remove(...recordingClasses);
		btn.classList.add(...defaultClasses);
		
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
			const command = final.toLowerCase().trim().replace(/[.,?!]/g, '');

			if (command === 'exit') {
				shouldContinue = false;
				stopRecording();
				return;
			}

			if (command === 'stop') {
				transcriptEl.innerText = '';
				interimEl.innerText = '';
				placeholder.classList.remove('hidden');
				
				isLogging = false; 
				updateGreenDot();
				return;
			}

			if (command === 'start') {
				isLogging = true;
				updateGreenDot();
				return;
			}

			if (command === 'clear') {
				transcriptEl.innerText = '';
				interimEl.innerText = ''; 
				placeholder.classList.remove('hidden');
				return; 
			}
			
			if (isLogging) {
				transcriptEl.innerText += final + ' ';
			}
		}
		
		if (isLogging) {
			interimEl.innerText = interim;
		} else {
			interimEl.innerText = '';
		}

		if (transcriptEl.innerText || interimEl.innerText) {
			placeholder.classList.add('hidden');
		} else {
			placeholder.classList.remove('hidden');
		}
	};

	recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
		if (event.error === 'no-speech') return;
		if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
			shouldContinue = false;
			stopRecording();
		}
	};
}

function startRecording() {
	shouldContinue = true; 
	isLogging = true;
	if (recognition) recognition.start();
}

function stopRecording() {
	shouldContinue = false; 
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