export class ExtractionService
{
    constructor(shared)
    {
        this.shared = shared;
    }

    extractStudentNumber(loadDropboxFiles) {
        console.log(`%c Extracting St Number`, "color: red");
        // Select all h6 elements on the page
        const h6Element = [...document.querySelectorAll("h6")].filter((task) =>
          task.textContent.includes("Student number")
        );
        const studentNumber = h6Element[0]?.textContent?.split(":")[1]?.trim();
        studentNumberEl.textContent = studentNumber;
      
        // extractTaskName(studentNumber); //! Step 2.1 :  Call function to "Extracts the task name"
        this.extractTaskName(studentNumber, loadDropboxFiles); 
        this.extractStudentName();
      }

    extractStudentName() {
        console.log(`%c Extracting St Name`, "color: red");
        
        // Select all h6 elements on the page
        // Filter the selected h6 elements to only include those that contain the text "Student:"
        const h6Element = [...document.querySelectorAll("h6")].filter((task) =>
            task.textContent.includes("Student:")
        );
        const stName = h6Element[0]?.textContent?.split(":")[1]?.trim();  
        return stName;
    }

    extractTaskName(studentNumber, loadDropboxFiles) {
        this.shared.sharedStudentNum = studentNumber;
        // open dropbox and search for the student number
        lookUpStudentBtn.addEventListener("click", () => {
          let link = `https://www.dropbox.com/search/work?path=%2F&query=${studentNumber}`;
          window.open(link, "_blank");
        });
        console.log(`%c Extracting Task Name`, "color: red");
      
        // Only extract the h6 elements that contain the word "Task"
        let h6Tags = [...document.querySelectorAll("h6")].filter((task) =>
          task.textContent.includes("Task")
        );
      
        //extract the "Task #digit" from after the firs ":" = Task: Task 7 - Database Interaction
        // Loop through each list item
        h6Tags.forEach((item) => {
      
          // Create a regular expression to match "Task" followed by a space, one or more digits, and a hyphen "-"
          let regex = /Task \d+/gi;
      
      
          // Test if the search word is found in the list item's text content
          if (regex.test(item.textContent)) {
      
            // If the search word is found, replace it with a highlighted version
            this.shared.taskNum = item.textContent.match(regex)[0].split(" ")[1];
            console.log(this.shared.taskNum)
      
            localStorage.setItem("taskNumber", `Task ${this.shared.taskNum}`);//save task number to local storage
      
      
          }
        });
      
      
      
      
        // Loop through each h6 element and extract the text after "-" = Task: Task 7 - Database Interaction
        h6Tags.forEach((task) => {
      
          const text = task?.textContent?.trim();
          const index = text.lastIndexOf("-") + 1;
      
          // If the text contains "-", extract the text after "-" and check if it contains ":"
          if (index !== 0) {
            this.shared.foundTaskName = text?.substring(index)?.trim();
      
            // If the result contains ":", extract the text after the last ":" instead
            if (this.shared.foundTaskName.includes(":")) {
              const lastIndex = this.shared.foundTaskName.lastIndexOf(":") + 1;
              this.shared.foundTaskName = this.shared.foundTaskName?.substring(lastIndex)?.trim();
            }
          }
      
          taskNameEl.textContent = this.shared.foundTaskName;
      
          //remove the loader before getting results
      
          this.shared.removeSpinner = true;
          loadDropboxFiles(studentNumber, this.shared.foundTaskName, 0);
        });
      }
}