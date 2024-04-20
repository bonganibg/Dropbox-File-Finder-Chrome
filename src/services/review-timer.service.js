export class ReviewTimerService
{
    constructor(shared){
        this.shared = shared;    
        this.startTimer = null;
    }

    setUpTimer(createUI){        
        if ( window.location.pathname.includes("generate_review") || 
             window.location.pathname.includes("generate_dfe_review")) {
            createUI();

            // Start Review Timer
            this.loadTimer();        
            this.startTimer = setInterval(() => this.reviewTimer(), 1000);
        }

        //Reset timer
        timeResetIcon.addEventListener("click", async () => {
            console.log(`%c timer reset`, 'color: #ffba08')
            clearInterval(this.startTimer);

            this.shared.counter = 0;
            this.shared.min = 0;
            localStorage.setItem("minutes", null);
            localStorage.setItem("counter", null);
            this.shared.combinedTime = 0;


            this.startTimer = setInterval(() => this.reviewTimer(), 1000);
            await this.loadTimer();
        });

        //===================================================== review count

        // Increment review count when review is finished and save to local storage
        reviewCompleteBtn?.addEventListener("click", () => {
        this.shared.reviewCount++;
        localStorage.setItem("reviewCount", this.shared.reviewCount);

        counterEl.style.color = "#8BC34A";
        counterEl.style.animationDuration = "3s";
        });
    }

    async loadTimer(){
        if (window.location.pathname.includes("generate_review")) {
            // Start the interval when the page is visible
            async function handleVisibilityChange() {
              if (document.visibilityState === "visible") {
                clearInterval(this.startTimer);

                this.startTimer = setInterval(() => this.reviewTimer, 1000);               

                document.removeEventListener(
                  "visibilitychange",
                  handleVisibilityChange
                ); //remove event listener to avoid multiple executions
              } else {
                clearInterval(this.startTimer);
              }
            }
        
            document.addEventListener("visibilitychange", handleVisibilityChange);
          } else {
            clearInterval(this.startTimer);
          }
        
        
          // Initialize the counter and last saved time from local storage, or use default values
          this.shared.counter = parseInt(localStorage.getItem("counter")) || 0;
          this.shared.min = parseInt(localStorage.getItem("minutes")) || 0;
          this.shared.lastSavedTime =
            parseInt(localStorage.getItem("lastSavedTime")) || new Date().getTime();
        
          // Calculate the elapsed time since the last saved time and add it to the counter
          this.shared.counter += Math.floor((new Date().getTime() - this.shared.lastSavedTime) / 1000);
        
          // Save the current counter and time to local storage when the program is closed
        
          window.addEventListener("beforeunload", async () => {
            this.saveTimeValues();
            clearInterval(this.startTimer);
          });
        
        
        
          //From the "Review Submit" page, reset timer when returning to dashboard
          let myWord = "Return to dashboard";
          let aTags = document.querySelectorAll("a");
          aTags?.forEach((item) => {
            if (item?.textContent.includes(myWord)) {
              item.addEventListener("click", () => {
                this.shared.counter = 0;
                this.shared.min = 0;
                localStorage.setItem("minutes", null);
                localStorage.setItem("counter", null);
                localStorage.setItem("lastSavedTime", null);
                clearInterval(this.startTimer);
                if (localStorage.getItem("rememberReview") == "false") {
                  localStorage.setItem("id_improve_comments", "");
                  localStorage.setItem("id_positive_comments", "");
                  localStorage.setItem("id_overall_comments", "");
                }
              });
            }
        });
    }

    reviewTimer() {        
        this.shared.counter++;
      
        // Check if the value of 'counter' has exceeded 59 seconds
        if (this.shared.counter > 59) {
          // Calculate the number of full minutes that have elapsed
          // and add it to the 'min' variable
          // The Math.floor() method is used to round down to the nearest integer
          // e.g. if 'counter' is 75 seconds, the quotient of counter / 60 is 1.25,
          // but we only want to add 1 full minute to 'min'
          this.shared.min += Math.floor(this.shared.counter / 60);
      
          // Calculate the remaining seconds after removing the full minutes
          // and set the value of 'counter' to this value
          // The modulus operator (%) returns the remainder of the division
          // e.g. if 'counter' is 75 seconds, the remainder of counter % 60 is 15,
          // which represents the number of seconds that have elapsed after 1 full minute
          this.shared.counter %= 60;
        }
      
        //set time warning colors
        if (this.shared.min < 5) {
          counterEl.style.color = "#8BC34A";
          counterEl.style.animationDuration = "10s";
        } else if (this.shared.min < 7) {
          counterEl.style.color = "#ffeb3b";
          counterEl.style.animationDuration = "5s";
        } else if (this.shared.min < 11) {
          counterEl.style.color = "#ff9800";
          counterEl.style.animationDuration = "2s";
        } else if (this.shared.min < 13) {
          counterEl.style.color = "#ff5722";
          counterEl.style.animationDuration = "1s";
        } else if (this.shared.min < 15) {
          counterEl.style.color = "#f44336";
          counterEl.style.animationDuration = ".2s";
        } else {
          counterEl.style.color = "#f44336";
          counterEl.style.animationDuration = ".2s";
        }
      
        //Combine minutes and seconds into one string
        this.shared.combinedTime = `${this.shared.min > 9 ? "" : 0}${this.shared.min}:${this.shared.counter > 9 ? "" : 0}${this.shared.counter}`;
      
        //Stop timer at 60 minutes
        if (this.shared.min > 60) {
          counterEl.style.color = "#f44336";
          counterEl.style.animationDuration = ".2s ";
          this.shared.combinedTime = "59:00";
          clearInterval(this.startTimer);
        }
      
        counterEl.textContent = this.shared.combinedTime;
      
        // Save the current counter and time to local storage every second
        this.saveTimeValues();
    }

    saveTimeValues() {
        localStorage.setItem("counter", this.shared.counter);
        localStorage.setItem("minutes", this.shared.min);
        localStorage.setItem("lastSavedTime", new Date().getTime());
      }
    
}