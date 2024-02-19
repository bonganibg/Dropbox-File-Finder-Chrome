let floatingElement = document.createElement("div");
let reviewCompleteBtn = document.querySelector("#submit-review-btn");
let timerContainer = document.createElement("div");
timerContainer.className = "DBXFF-timer-container";

//Create the reset timer button
let timeResetIcon = document.createElement("img");
timeResetIcon.src = chrome.runtime.getURL("images/reset.png");
timeResetIcon.alt = "reset timer";
timeResetIcon.title = "Reset timer";
timerContainer.appendChild(timeResetIcon);
floatingElement.prepend(timerContainer);

// Create the counter element
let counterEl = document.createElement("p");
counterEl.className = "DBXFF-timer";
counterEl.classList.add("pulsate-fwd");
timerContainer.prepend(counterEl);

// Create the review details element UI
let reviewDetailsEl = document.createElement("div");
reviewDetailsEl.className = "DBXFF-review-details";
// Create the student name element
let studentNameEl = document.createElement("h4");
let studentNumberContainerEl = document.createElement("div");
studentNumberContainerEl.className = "DBXFF-student-number-container";

// Create the open Dropbox link button
let lookUpStudentBtn = document.createElement("img");
lookUpStudentBtn.src = chrome.runtime.getURL("images/externalLink.png"); // Set the image source
lookUpStudentBtn.title = "Look up number in dropbox";

let studentNumberEl = document.createElement("h4");
let taskNameEl = document.createElement("div");