const fs = require("fs");

async function DeleteUploadedImage(filePath) {
  try {
    if (filePath) {
      const fileExists = fs.existsSync(filePath);
      if (fileExists) {
        fs.unlinkSync(filePath); 
        return true;
      } else {
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error); 
    return false;
  }
}

module.exports = DeleteUploadedImage;
