import request from "request"

export default class TelegramBot {
  constructor(token) {
    this.baseUrl = `https://api.telegram.org/bot${token}/`
  }

  setWebhook(url) {
    return this._post('setWebhook', { url })
  }

  sendMessage({chat_id, text, display_web_page_preview = false}) {
    return this._post('sendMessage', {
      chat_id,
      text,
      display_web_page_preview,
      parse_mode: 'Markdown'
    })
  }

  _post(method, data) {
    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        uri: `${this.baseUrl}${method}`,
        form: data
      }, (error, response, body) => {
        if (error) return reject(error)

        if (response.statusCode >= 200 && response.statusCode <= 299) {
          resolve(JSON.parse(body))
        } else {
          reject(new Error(body))
        }
      })
    })
  }
}


