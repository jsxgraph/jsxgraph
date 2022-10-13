import JXG from "jxg";
import Zip from "utils/zip";
import Base64 from "utils/base64";
JXG.decompress = function (str) {
  //return unescape((new Zip.Unzip(Base64.decodeAsArray(str))).unzip()[0][0]);
  return decodeURIComponent(
    new Zip.Unzip(Base64.decodeAsArray(str)).unzip()[0][0]
  );
};

export default JXG;
