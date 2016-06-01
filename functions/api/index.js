import AWS from 'aws-sdk'
const lambda = new AWS.Lambda({
  region: 'ap-northeast-1'
})

export default async function (event, context) {
  try {
    lambda.invoke({
      FunctionName: 'movies-bot_default',
      Payload: { chat_id: event.chat_id }
    })
    context.succeed({ ok: true })
  } catch (error) {
    context.fail(error)
  }
}
