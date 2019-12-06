import config from "../config";
const qiniu = require("qiniu");

const qiniuUtils = {
    //文件上传
    qiniuUpload: (filePath, name) => {
        return new Promise((resolve, reject) => {
            const accessKey = config.qiniuAccessKey;
            const secretKey = config.qiniuSecretKey;
            const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
            const options = { scope: config.qiniuBucket };
            const putPolicy = new qiniu.rs.PutPolicy(options);
            const uploadToken = putPolicy.uploadToken(mac);
            const qiniuconfig = new qiniu.conf.Config();
            const formUploader = new qiniu.form_up.FormUploader(qiniuconfig);
            const putExtra = new qiniu.form_up.PutExtra();
            // putExtra.progressCallback = function(uploadBytes, totalBytes) {
            //     console.log("progress:" + uploadBytes + "(" + totalBytes + ")");
            // };
            // 文件上传
            formUploader.putFile(uploadToken, name, filePath, putExtra, (respErr, respBody, respInfo) => {
                if (respErr) {
                    reject(respErr);
                    console.error(respErr);
                }
                if (respInfo.statusCode == 200) {
                    resolve(respBody);
                    console.error(respBody);
                } else {
                    reject(respBody);
                    console.error(respBody);
                }
            });
        });
    },
    //文件删除
    qiniuDelete: name => {
        return new Promise((resolve, reject) => {
            const accessKey = config.qiniuAccessKey;
            const secretKey = config.qiniuSecretKey;
            const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
            const qiniuconfig = new qiniu.conf.Config();
            // config.zone = qiniu.zone.Zone_z0;
            const bucketManager = new qiniu.rs.BucketManager(mac, qiniuconfig);
            bucketManager.delete(config.qiniuBucket, name, function(err, respBody, respInfo) {
                if (err) {
                    reject(respErr);
                    console.error(respErr);
                } else {
                    if (respInfo.statusCode == 200) {
                        resolve(respBody);
                        console.log(respBody);
                    } else {
                        reject(respBody);
                        console.error(respBody);
                    }
                }
            });
        });
    }
};

export default qiniuUtils;
