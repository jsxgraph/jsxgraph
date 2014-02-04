define(['jxg', 'utils/zip', 'utils/base64'], function (JXG, Zip, Base64) {
    JXG.decompress = function (str) {
        return unescape((new Zip.Unzip(Base64.decodeAsArray(str))).unzip()[0][0]);
    };

    return JXG;
});
