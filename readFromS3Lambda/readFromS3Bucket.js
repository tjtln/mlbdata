import aws from 'aws-sdk';

export const handler = async(event) => {
    const s3 = new aws.S3();
    var data;
    const params = {
        Bucket: "mlbdatabucket",
        Key: "mlbDataForFirstInning.json"
      };
    try {
        const response = await s3.getObject(params).promise();
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