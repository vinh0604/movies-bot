import AWS from 'aws-sdk'
import config from '../default/config'
const sns = new AWS.SNS({
  region: 'ap-northeast-1'
})

export default async function (event, context) {
  console.log(event)
  if (event.token !== config.API_TOKEN) {
    return context.fail("Invalid token")
  }
  try {
    let promise = new Promise((resolve, reject) => {
      sns.publish({
        Message: JSON.stringify({ chat_id: event.chat_id }),
        Subject: "Trigger movies bot",
        TopicArn: "arn:aws:sns:ap-northeast-1:623305565440:movies_bot"
      }, function (err, data) {
        if (err) reject(err)
        else resolve(data)
      })
    })
    await promise
    context.succeed({ ok: true })
  } catch (error) {
    context.fail(error)
  }
}
