import { S3 } from '@aws-sdk/client-s3';

export const handler = async(event) => {
    const s3 = new S3();
    var data;
    const params = {
        Bucket: "mlbdatabucket",
        Key: "mlbDataForFirstInning.json"
      };
    try {
        const response = await s3.getObject(params);
        data = response.Body.toString('utf-8');
        console.log('Response: ', response);
    } catch (err) {
        console.log(err);
    }
    const returnObject = {
        statusCode: 200,
        body: data,
    };
    console.log(data);
    return returnObject
}