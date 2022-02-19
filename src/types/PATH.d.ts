interface Spider {
  datasourcePath: string;
  recordFilename: string;
  errorPath: string;
  saveFilename: string;
}

declare interface Result {
  userId2IndexMapFilepath: string;
  movieId2IndexMapFilepath: string;
  savedFilepath: string;
  originFilepath: string;
  waitMergeDirPath: string;
}

declare const PATH = {
  spider: {} as Spider,
  result: {} as Result
};
