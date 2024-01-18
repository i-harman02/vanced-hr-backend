const fs = require("fs");
const Image = require("../../../models/image");
const path = require("path");

async function removeImage(user_Id) {
  const existingImage = await Image.findOne({ user_Id });
  if (existingImage && existingImage.path) {
    let deleted = await Image.deleteOne({ _id: existingImage.id });
    //fs.unlinkSync(existingImage.path);
    return deleted;
  }
}
module.exports = removeImage;
