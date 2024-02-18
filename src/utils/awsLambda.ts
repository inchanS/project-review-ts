import {
  InvokeCommand,
  InvokeCommandOutput,
  LambdaClient,
} from '@aws-sdk/client-lambda';

const awsLambda: LambdaClient = new LambdaClient({
  region: process.env.AWS_REGION,
});

export const invokeLambda = async (param: Params) => {
  const lambdaParams: any = {
    FunctionName: 'checkFileAccessLambda',
    Payload: JSON.stringify(param),
  };

  const command: InvokeCommand = new InvokeCommand(lambdaParams);

  console.log(param);
  console.log(lambdaParams);

  try {
    // FIXME 람다함수가 제대로 발동되는지 아닌지 확인이 필요하다! (아마도 제대로 발동되지 않는듯)
    const result: InvokeCommandOutput = await awsLambda.send(command);
    console.log(result);
  } catch (err) {
    console.log(err);
  }
};
