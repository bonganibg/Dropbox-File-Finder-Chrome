import { AuthenticaionService } from "./services/auth.service";
import { ExtractionService } from "./services/extraction.service";
import { DropboxService } from "./services/dropbox.service";

const shared = {
  counter: undefined,
  min: undefined,
  lastSavedTime: undefined,
  foundTaskName: undefined,
  StudentName:  "",
  sharedStudentNum:  "",
  routeList: undefined,
  reviewCount:  0,
  inc :  0,
  combinedTime:  0,
  removeSpinner :  false,
  hashParams:  undefined,
  rootPath:  "", // not used
  fileName:  "", // not used
  foundFiles:  false,
  storeToken : "", // not used
  taskNum: undefined,
  studentName: undefined
}

const extractionService = new ExtractionService(shared);
const dropboxService = new DropboxService(shared);

//! Dropbox credentials

const dropboxClientId = 'gsw6a2m0r2u44lt';
const clientSecret = 'nwpi7lk0yyp2v44';
const redirectHomeUrl = "https://hyperiondev.cogrammar.com/reviewer/dashboard/"; // your redirect URI http://localhost:3000/testRoute/index.html

let auth = new AuthenticaionService(dropboxClientId, clientSecret, redirectHomeUrl, shared);
console.log(auth);

let dbx  = auth.createDbxConnection();

// ----------------------------------------------------------------------------------------
// ----------------------------SET UP BUTTON STUFF ----------------------------------------
// ----------------------------------------------------------------------------------------

//Don't check token on review page
let startTimer;
if ( window.location.pathname.includes("generate_review") || 
window.location.pathname.includes("generate_dfe_review")) {
  createUI();

  // Start Review Timer
  loadTimer();
  startTimer = setInterval(() => reviewTimer(), 1000);
}

//Reset timer
timeResetIcon.addEventListener("click", async () => {
  console.log(`%c timer reset`, 'color: #ffba08')
  clearInterval(startTimer);

  shared.counter = 0;
  shared.min = 0;
  localStorage.setItem("minutes", null);
  localStorage.setItem("counter", null);
  shared.combinedTime = 0;


  startTimer = setInterval(() => reviewTimer(), 1000);
  await loadTimer();

});

//===================================================== review count

// Increment review count when review is finished and save to local storage
reviewCompleteBtn?.addEventListener("click", () => {
  shared.reviewCount++;
  localStorage.setItem("reviewCount", shared.reviewCount);

  counterEl.style.color = "#8BC34A";
  counterEl.style.animationDuration = "3s";
});

// ----------------------------------------------------------------------------------------
// ----------------------------SET UP BUTTON STUFF ----------------------------------------
// ----------------------------------------------------------------------------------------

//! Step 2:  Create Floating UI popup
function createUI() {
  console.log(`%c Creating UI`, "color: red");
  // Create the floating element properties
  let resultsLoaderEl = document.createElement("span");
  resultsLoaderEl.className = "result_loader";

  shared.routeList = document.createElement("div");
  shared.routeList.className = "DBXFF-query-results";
  shared.routeList.innerHTML = `<span class="result_loader"></span>`;
  const inputContainer = document.createElement("div");
  inputContainer.className = "DBXFF-main-input-container";

  //const header = document.createElement("h1");
  //header.innerText = "Floating Element";
  floatingElement.className = "DBXFF-box-layout DBXFF-slide-in-left";
  floatingElement.style.backgroundImage = `url(${chrome.runtime.getURL(
    "./images/nav-bg.gif"
  )})`;

  //create the toggle button
  let slideBtn = document.createElement("div");
  slideBtn.className = "DBXFF-slide-btn ";
  slideBtn.textContent = "Hide";
  let hide = false;
  slideBtn.addEventListener("click", () => {
    floatingElement.classList.toggle("DBXFF-slide-out-left");
    slideBtn.classList.toggle("toggleBtn");
    hide = !hide;

    if (hide) {
      slideBtn.textContent = "Show";
      timerContainer.classList.add("DBXFF-timer-container-fixed", "fade-in");
    } else {
      slideBtn.textContent = "Hide";
      timerContainer.classList.remove("DBXFF-timer-container-fixed", "fade-in");
    }
  });

  studentNumberEl.id = "DBXFF-mystudentNumberEl";
  taskNameEl.id = "DBXFF-mytaskNameEl";

  floatingElement.prepend(slideBtn);
  //floatingElement.appendChild(header);
  studentNameEl.textContent = extractionService.extractStudentName();
  reviewDetailsEl.appendChild(studentNameEl);
  studentNumberContainerEl.appendChild(lookUpStudentBtn);
  studentNumberContainerEl.appendChild(studentNumberEl);
  reviewDetailsEl.appendChild(studentNumberContainerEl);
  reviewDetailsEl.appendChild(taskNameEl);
  inputContainer.appendChild(reviewDetailsEl);

  inputContainer.appendChild(shared.routeList);
  floatingElement.appendChild(inputContainer);

  document.body.appendChild(floatingElement);

  // Call function to get page values and update UI elements
  extractionService.extractStudentNumber(filesSearch); //! Step 2.1 : Call function to "Extract the student number"

  //reviewTimer()
  getReviewCounts();
}
``

//! Step 3 Find a specific file by name - Display results
//if more then one root folder exists for example "myFolder and myFolder (1)...",
//first search for my myFolder, then using an incrementor to control the value
//between the brackets, and making up to 3 searches each time adding its results to the UI

async function filesSearch(studentNumber, taskName) {
  let query = taskName;

  //update "build your brand" strings
  //! BYB tasks files are sometimes written as byb 04 or byb IV. But on the review page it is always written with Roman numerals
  //THis function will only update task name if the dropbox files contains number instead of roman numerals.
  let pattern = /build your brand/i;
  if (query.match(pattern) && /(01|02|03|04|05)/.test(query)) {
    query = replaceRomanNumeralsWithNumbers(query).toLowerCase();
  
  }

  console.log('query', query)

  console.log(`%c Searching for files ${shared.inc}`, "color: #5390d9");
  let root = studentNumber;
  let retry = shared.inc;

  const path = shared.inc > 0 ? root + ` (${retry})` : root;

  // Call the Dropbox API to search for a file
  await dbx
    .filesSearchV2({
      query: query,
      options: {
        path: "/" + path,
        //file_extensions: [".pdf"],
        max_results: 5,
      },
    })
    .then(function (response) {
      if (shared.removeSpinner) {
        shared.routeList.innerHTML = "";
        shared.removeSpinner = false;
      }

      console.log(`%c  making request: ${shared.inc}`, "color: orange");
      shared.inc++; //after 1rst request look for a 2nd folder
      let results = response.result.matches;

      //if results are 0 and we did 3 searches already? stop
      if (shared.inc >= 4) {
        highlightTaskName(query);

        return;
      } else {
        if (!shared.foundFiles) {
          //foundFiles = true;
          console.log(`%c results found: ${results.length}`, "color: #2196f3");
       
          //Creates a list of all the results results
          //Aldo build the dive that contains the download button and the link to the folder
          results.forEach((item, i) => {
            let taskNumber = item.metadata.metadata.path_display
            console.log('taskNum', shared.taskNum)
            // Only display the results that contain the task number
            if (taskNumber.includes(shared.taskNum)) {
              if (shared.taskNum < 10) {
                shared.taskNum = "T0" + shared.taskNum[shared.taskNum.length - 1];
               
               }

              let btnAndListContainer = document.createElement("div");
              btnAndListContainer.className = "DBXFF-btnAndListContainer";
              let foundRes = document.createElement("div");
              foundRes.className = "DBXFF-foundRes";
              foundRes.textContent = item.metadata.metadata.path_display;
              let dlIconContainer = document.createElement("div");
              dlIconContainer.className = "DBXFF-dlIconContainer";
              let dlIcon = document.createElement("img");
              let linkIcon = document.createElement("img");
              linkIcon.title = "Open Task Folder in dropbox";
              linkIcon.src = chrome.runtime.getURL("images/externalLink.png");
              linkIcon.addEventListener("click", async (e) => {
                let str = item.metadata.metadata.path_display;

                // Find the last index of "/"
                let lastSlashIndex = str.lastIndexOf("/");

                // Remove everything after the last "/"
                let newStr = str.substring(0, lastSlashIndex);

                // Replace all spaces with "%20"
                let link =
                  "https://www.dropbox.com/work/HyperionDev%20Reviewers" +
                  newStr.replace(" ", "%20");

                // Open the folder URL in a new tab
                window.open(link, "_blank");
              });
              let type = document.createElement("img");
              type.alt = item.metadata.metadata.name;
              dlIcon.src = chrome.runtime.getURL("images/dlFOlder.png");
              dlIcon.alt = "dl-icon";
              dlIcon.className = "DBXFF-dl-icon-list";
              dlIcon.title = "Download Task folder";
              dlIcon.addEventListener("click", async (e) => {
                e.stopPropagation(); //prevent the route from being selected
                dlIcon.classList.add("rotate-center");
                dlIcon.src = chrome.runtime.getURL("images/loader.png");
                //! Download selected Folder or file
                dropboxService.downloadFolder(item.metadata.metadata, dlIcon, dbx); //folder
              });

              dlIconContainer.appendChild(dlIcon);
              btnAndListContainer.appendChild(dlIconContainer);
              btnAndListContainer.appendChild(linkIcon);
              btnAndListContainer.appendChild(foundRes);
              shared.routeList.appendChild(btnAndListContainer);

            }

          });

          //look in 2nd and 3rd folder
          if (shared.inc >= 4) {
            return;
          }
          filesSearch(studentNumber, taskName);
        }
      }
    })
    .catch(async function (error) {
      console.log(error);
      if (shared.removeSpinner) {

        shared.routeList.innerHTML = `
        <p>Either the token has expired. A popup will appear. (If not - Refresh Browser)</p>
        <br>
        <p>Or the Task Name could no be found inside student folders</p>
        <br>
        <p>Or CoGrammar API is offline</p>
        <br>
        <p>Or you have an internet connection issue</p>
        <br>
        <p>Try looking up the student number in Dropbox</p>
        `;
        shared.removeSpinner = false;
      }
      console.log(`%c Search ended`, "color: hotpink");
      await auth.checkToken(dbx);

      return;
    });
}
//Extracts the words that matches the task name and only highlight those words.
function highlightTaskName(taskName) {

  // Get all the  elements that contains the entire path name
  const parentDivs = document.querySelectorAll(".DBXFF-foundRes");

  // Loop through each parent div
  parentDivs.forEach((div) => {


    // Get the text content of the child div
    let itemText = div.textContent?.toLowerCase()?.trim();

    //split the words into an array
    let wordsToHighlight = taskName.split(" ");

    //FInd the task number, and highlight it yellow
    let numbersToHighlight = shared.taskNum.split(" ");

    //highlight the task number
    numbersToHighlight.forEach((num) => {
      if (num.length > 0) {
        if (itemText.includes(num.toLowerCase())) {
          let found = div.innerHTML.replace(
            new RegExp(num, "gi"),
            `<b style="font-weight: 100; color: #FFC107">${num}</b>`
          );
          div.innerHTML = found;
        }
      }
    });



    wordsToHighlight.forEach((word) => {
      if (word.length > 2) {
        if (itemText.includes(word.toLowerCase())) {
          let found = div.innerHTML.replace(
            new RegExp(word, "gi"),
            `<b class="highlight">${word}</b>`
          );
          div.innerHTML = found;
        }
      }
    });
  });

}

//====================================================Review Timer
async function loadTimer() {
  /*

   When the program is closed, it saves the current counter and
    time to local storage using the beforeunload event, 
    and clears the interval to stop incrementing the counter. 
    When the program is restarted, it initializes the counter 
    and last saved time from local storage again, and repeats 
    the process to include the missing seconds and continue 
    incrementing the counter.
   */

  if (window.location.pathname.includes("generate_review")) {
    // Start the interval when the page is visible
    async function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        clearInterval(startTimer);
        startTimer = setInterval(() => reviewTimer(), 1000);
        await loadTimer();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        ); //remove event listener to avoid multiple executions
      } else {
        clearInterval(startTimer);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
  } else {
    clearInterval(startTimer);
  }


  // Initialize the counter and last saved time from local storage, or use default values
  shared.counter = parseInt(localStorage.getItem("counter")) || 0;
  shared.min = parseInt(localStorage.getItem("minutes")) || 0;
  shared.lastSavedTime =
    parseInt(localStorage.getItem("lastSavedTime")) || new Date().getTime();

  // Calculate the elapsed time since the last saved time and add it to the counter
  shared.counter += Math.floor((new Date().getTime() - shared.lastSavedTime) / 1000);

  // Save the current counter and time to local storage when the program is closed

  window.addEventListener("beforeunload", async () => {
    saveTimeValues();
    clearInterval(startTimer);
  });



  //From the "Review Submit" page, reset timer when returning to dashboard
  let myWord = "Return to dashboard";
  let aTags = document.querySelectorAll("a");
  aTags?.forEach((item) => {
    if (item?.textContent.includes(myWord)) {
      item.addEventListener("click", () => {
        shared.counter = 0;
        shared.min = 0;
        localStorage.setItem("minutes", null);
        localStorage.setItem("counter", null);
        localStorage.setItem("lastSavedTime", null);
        clearInterval(startTimer);
        if (localStorage.getItem("rememberReview") == "false") {
          localStorage.setItem("id_improve_comments", "");
          localStorage.setItem("id_positive_comments", "");
          localStorage.setItem("id_overall_comments", "");
        }
      });
    }
  });
}

function reviewTimer() {
  shared.counter++;

  // Check if the value of 'counter' has exceeded 59 seconds
  if (shared.counter > 59) {
    // Calculate the number of full minutes that have elapsed
    // and add it to the 'min' variable
    // The Math.floor() method is used to round down to the nearest integer
    // e.g. if 'counter' is 75 seconds, the quotient of counter / 60 is 1.25,
    // but we only want to add 1 full minute to 'min'
    shared.min += Math.floor(shared.counter / 60);

    // Calculate the remaining seconds after removing the full minutes
    // and set the value of 'counter' to this value
    // The modulus operator (%) returns the remainder of the division
    // e.g. if 'counter' is 75 seconds, the remainder of counter % 60 is 15,
    // which represents the number of seconds that have elapsed after 1 full minute
    shared.counter %= 60;
  }

  //set time warning colors
  if (shared.min < 5) {
    counterEl.style.color = "#8BC34A";
    counterEl.style.animationDuration = "10s";
  } else if (shared.min < 7) {
    counterEl.style.color = "#ffeb3b";
    counterEl.style.animationDuration = "5s";
  } else if (shared.min < 11) {
    counterEl.style.color = "#ff9800";
    counterEl.style.animationDuration = "2s";
  } else if (shared.min < 13) {
    counterEl.style.color = "#ff5722";
    counterEl.style.animationDuration = "1s";
  } else if (shared.min < 15) {
    counterEl.style.color = "#f44336";
    counterEl.style.animationDuration = ".2s";
  } else {
    counterEl.style.color = "#f44336";
    counterEl.style.animationDuration = ".2s";
  }

  //Combine minutes and seconds into one string
  shared.combinedTime = `${shared.min > 9 ? "" : 0}${shared.min}:${shared.counter > 9 ? "" : 0}${shared.counter}`;

  //Stop timer at 60 minutes
  if (shared.min > 60) {
    counterEl.style.color = "#f44336";
    counterEl.style.animationDuration = ".2s ";
    shared.combinedTime = "59:00";
    clearInterval(startTimer);
  }

  counterEl.textContent = shared.combinedTime;

  // Save the current counter and time to local storage every second
  saveTimeValues();
}

// Save the current counter and time to local storage
function saveTimeValues() {
  localStorage.setItem("counter", shared.counter);
  localStorage.setItem("minutes", shared.min);
  localStorage.setItem("lastSavedTime", new Date().getTime());
}

// Get review count from local storage and display it
function getReviewCounts() {
  let prevCounts = localStorage.getItem("reviewCount");
  shared.reviewCount = prevCounts ? prevCounts : 0;
  let counterContainerEl = document.createElement("div");
  counterContainerEl.className = "DBXFF-counter-container";
  let reviewCountEl = document.createElement("p");
  reviewCountEl.className = "DBXFF-review-count";
  reviewCountEl.textContent = `Reviews done: ${shared.reviewCount}`;

  let reviewReset = document.createElement("img");
  reviewReset.src = chrome.runtime.getURL("images/reset.png");
  reviewReset.alt = "reviewReset";
  reviewReset.title = "Reset";

  //Reset review count
  reviewReset.addEventListener("click", () => {
    let sure = confirm("Are you sure you want to reset the review count?");
    if (sure) {
      shared.reviewCount = 0;
      localStorage.setItem("reviewCount", 0);
      reviewCountEl.textContent = `Reviews done: 0`;
    }
  });

  counterContainerEl.prepend(reviewReset);
  counterContainerEl.prepend(reviewCountEl);
  floatingElement.prepend(counterContainerEl);
}


//Build your brand tasks string manipulation
// Define a function to replace Roman numerals with corresponding numbers
function replaceRomanNumeralsWithNumbers(inputString) {

  // Define a mapping of Roman numerals to numbers
  const romanToNumberMap = {
    I: "01",
    II: "02",
    III: "03",
    IV: "04",
    V: "05",
    VI: "06",
    // Add more Roman numerals and their corresponding numbers as needed
  };
  //console.log('romanToNumberMap', romanToNumberMap.I)

  // Define a regular expression to match Roman numerals
  const romanNumeralRegex = /\b(I|II|III|IV|V|VI)\b/g;

  // Use the replace() method with a callback function to replace Roman numerals with numbers
  return inputString.replace(romanNumeralRegex, (match, romanNumeral) => {
    return romanToNumberMap[romanNumeral] || match;
  });
}


function highlightTaskNumber() {
  // Loop through each list item
  listItems.forEach((item) => {

    // Create a regular expression to match "Task" followed by a space, one or more digits, and a hyphen "-"
    let regex = /Task \d+/gi;

    // Test if the search word is found in the list item's text content
    if (regex.test(item.textContent)) {

      // If the search word is found, replace it with a highlighted version
      let found = item.innerHTML.replace(regex, `<b class="highlight">$&</b>`);

      // Replace the original list item HTML with the highlighted version
      item.innerHTML = found;
    }
  });
}