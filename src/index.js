import { AuthenticaionService } from "./services/auth.service";
import { ExtractionService } from "./services/extraction.service";
import { DropboxService } from "./services/dropbox.service";
import { ReviewTimerService } from "./services/review-timer.service";

const shared = {
  counter: undefined,
  min: undefined,
  lastSavedTime: undefined,
  foundTaskName: undefined,
  StudentName:  "",
  sharedStudentNum:  "",
  routeList: undefined,
  reviewCount:  0,  
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

const DROPBOX_CLIENT_ID = 'gsw6a2m0r2u44lt';
const CLIENT_SECRET = 'nwpi7lk0yyp2v44';
const REDIRECT_HOME_URL = "https://hyperiondev.cogrammar.com/reviewer/dashboard/"; // your redirect URI http://localhost:3000/testRoute/index.html

const extractionService = new ExtractionService(shared);
const dropboxService = new DropboxService(shared);
const reviewTimerService = new ReviewTimerService(shared);

const auth = new AuthenticaionService(DROPBOX_CLIENT_ID, CLIENT_SECRET, REDIRECT_HOME_URL, shared);
const dbx  = auth.createDbxConnection();

(() => {
  reviewTimerService.setUpTimer(createUI)  
})()


//! Step 2:  Create Floating UI popup
function createUI() {
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
  extractionService.extractStudentNumber(loadDropboxFiles); //! Step 2.1 : Call function to "Extract the student number"

  //reviewTimer()
  getReviewCounts();
}

/**
 * Loads all of the students file links for a given task from dropbox
 * @param {string} studentNumber Student number to be searched
 * @param {string} taskName Name of the task being search
 * @param {number} inc Number of times the function has been called
 * @returns nothing
 */
async function loadDropboxFiles(studentNumber, taskName, inc){ 
  let query = filterBybName(taskName); //update "build your brand" strings  
  let response = await getFileSearch(studentNumber, query, inc);

  if (inc >= 4){
    highlightTaskName(query)
    return;
  }  

  if (response == undefined){
    let content = `
      <p>Either the token has expired. A popup will appear. (If not - Refresh Browser) <br>
      Or the Task Name could no be found inside student folders<br>
      Or CoGrammar API is offline<br>
      Or you have an internet connection issue<br>
      Try looking up the student number in Dropbox</p>
      `;

      hideSpinner(content);

      await auth.checkToken(dbx)
      return;
  }

  hideSpinner("");
  inc++;

  response.forEach((item, i) => {
    let taskNumber = item.metadata.metadata.path_display;

    if (taskNumber.includes(shared.taskNum)){      
      if (shared.taskNum < 10)
        shared.taskNum = "T0" + shared.taskNum[shared.taskNum.length - 1];

      createTaskSearchResultComponents(item);
    }
  });

  loadDropboxFiles(studentNumber, taskName, inc);    
}

/**
 * Highlights the task name in the file search popup
 * @param {string} taskName The name of the task
 */
function highlightTaskName(taskName) {
  const parentDivs = document.querySelectorAll(".DBXFF-foundRes");
  parentDivs.forEach((div) => {

    let itemText = div.textContent?.toLowerCase()?.trim();
    let wordsToHighlight = taskName.split(" ");
    let numbersToHighlight = shared.taskNum.split(" ");

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


/**
 * Checks if the task name is a BYB task that contains a roman numeral and returns numeric task name.
 * @param {string} query The name of the task 
 * @returns Task name   
 */
function filterBybName(query){  
  let pattern = /build your brand/i;

  if (query.match(pattern) && /(01|02|03|04|05)/.test(query)) {
    return replaceRomanNumeralsWithNumbers(query).toLowerCase();
  }  

  return query
}

/**
 * Replace roman numerals with numbers
 * @param {string} inputString Value to be updated
 * @returns 
 */
function replaceRomanNumeralsWithNumbers(inputString) {
  const romanToNumberMap = {
    I: "01",
    II: "02",
    III: "03",
    IV: "04",
    V: "05",
    VI: "06",
  };
  const romanNumeralRegex = /\b(I|II|III|IV|V|VI)\b/g;

  return inputString.replace(romanNumeralRegex, (match, romanNumeral) => {
    return romanToNumberMap[romanNumeral] || match;
  });
}

/**
 * Stops the spinner and displays a different HTML component in place
 * @param {string} content HTML string with content to be displayed
 * @returns nothing
 */
function hideSpinner(content){
  if (!shared.removeSpinner)
    return

  shared.routeList.innerHTML = content;
  shared.removeSpinner = false;
}

/**
 * Create the task details item in the file search popup
 * @param {object} item Current dropbox file item that is being checked.
 */
function createTaskSearchResultComponents(item){
  let btnAndListContainer = document.createElement("div");
  let foundRes = document.createElement("div");
  let dlIconContainer = document.createElement("div");
  let dlIcon = document.createElement("img");
  let linkIcon = document.createElement("img");

  
  btnAndListContainer.className = "DBXFF-btnAndListContainer";
  foundRes.className = "DBXFF-foundRes";
  foundRes.textContent = item.metadata.metadata.path_display;
  dlIconContainer.className = "DBXFF-dlIconContainer";
  linkIcon.title = "Open Task Folder in dropbox";
  linkIcon.src = chrome.runtime.getURL("images/externalLink.png");

  let type = document.createElement("img");
  type.alt = item.metadata.metadata.name;
  dlIcon.src = chrome.runtime.getURL("images/dlFOlder.png");
  dlIcon.alt = "dl-icon";
  dlIcon.className = "DBXFF-dl-icon-list";
  dlIcon.title = "Download Task folder";

  dlIconContainer.appendChild(dlIcon);
  btnAndListContainer.appendChild(dlIconContainer);
  btnAndListContainer.appendChild(linkIcon);
  btnAndListContainer.appendChild(foundRes);
  shared.routeList.appendChild(btnAndListContainer);

  linkIcon.addEventListener("click", async (e) => {
    let str = item.metadata.metadata.path_display;
    let lastSlashIndex = str.lastIndexOf("/");
    let newStr = str.substring(0, lastSlashIndex);
    let link = ["https://www.dropbox.com/work/HyperionDev%20Reviewers", 
                 newStr.replace(" ", "%20")].join()
                

    window.open(link, "_blank");
  });


  dlIcon.addEventListener("click", async (e) => {
    e.stopPropagation(); //prevent the route from being selected
    dlIcon.classList.add("rotate-center");
    dlIcon.src = chrome.runtime.getURL("images/loader.png");
    dropboxService.downloadFolder(item.metadata.metadata, dlIcon, dbx); //folder
  });
}

/**
 * Searches Dropbox for the students files for a given task.
 * @param {string} studentNumber Student number for the students being checked
 * @param {string} query The name of the task being searched
 * @param {number} inc The number of times the function has been called
 * @returns File details from Dropbox
 */
async function getFileSearch(studentNumber, query, inc){  
  let root = studentNumber;
  let retry = inc;

  const path = inc > 0 ? root + ` (${retry})` : root;
  
  
  try{    
    let response = await dbx.filesSearchV2({
      query: query,
      options: {
        path: "/" + path,
        max_results: 5
      }
    });

    let result = await response.result.matches;
    return result;
  } catch(err){
    console.log(err);  
  }
  
  return undefined;
}

//====================================================Review Timer

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
