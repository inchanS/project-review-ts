interface Params {
  Bucket: string;
  Key: string;
}

interface DeleteUploadFiles {
  uploadFileWithoutFeedId: number[];
  deleteFileLinksArray: string[];
}

interface deletableFilesBasket {
  uploadFileIdsToDelete: number[];
  fileLinksToDelete: string[];
}
