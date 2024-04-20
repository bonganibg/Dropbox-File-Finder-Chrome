export class DropboxService
{
    constructor(shared){
        this.shared = shared;
    }

    downloadFolder(dir, dlIcon, dbx) {
      console.log(`%c  creating Download Folder path`, "color: red");
      let pdfExists = false;
      if (dir.path_display.endsWith(".pdf")) {
        pdfExists = true;
      }
    
      //download the found files parent directory
      if (pdfExists) {
        const lastIndex = dir.path_display.lastIndexOf("/");
        const folderPath = dir.path_display.substring(0, lastIndex);
        this.downloadFileBob(folderPath, dlIcon, dbx);
      } else {
        //download the  directory
        this.downloadFileBob(dir.path_display, dlIcon, dbx);
      }
    }

    async downloadFileBob(path, dlIcon, dbx) {
      await dbx
        .filesDownloadZip({ path: path })
        .then(function (response) {
          //const fileName = response.result.metadata.name
          const blob = new Blob([response.result.fileBlob], {
            type: "application/zip",
          });
          this.getDLLink(blob, path.substring(path.lastIndexOf("/") + 1));
          //displayFiles(response.result.fileBlob);
        })
        .catch(function (error) {
          console.log(error);
          alert(
            "Error downloading file. Download folder could be containing more than 100 files"
          );
        });
    
      dlIcon.classList.remove("rotate-center");
      dlIcon.src = chrome.runtime.getURL("images/dlFOlder.png");
    }

    getDLLink(blob, name) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = shared.StudentName + "_" + name;
      document.body.appendChild(link);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      //loadingImage.style.display = "none";
    }

    

    
}