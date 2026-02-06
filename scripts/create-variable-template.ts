import twilio from 'twilio'
import * as dotenv from 'dotenv'

dotenv.config()

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function createVariableTemplate() {
  console.log('Creating Content Template with variable body...')

  try {
    const content = await client.content.v1.contents.create({
      friendlyName: 'balanstest-vraag-knoppen-v2',
      language: 'nl',
      variables: { '1': 'vraag_tekst' },
      types: {
        'twilio/quick-reply': {
          body: '{{1}}',
          actions: [
            { id: 'ja', title: '🔴 Ja' },
            { id: 'soms', title: '🟠 Soms' },
            { id: 'nee', title: '🟢 Nee' },
          ],
        },
      } as any,
    })

    console.log('✅ Content Template aangemaakt!')
    console.log('SID:', content.sid)
    console.log('')
    console.log('Update TWILIO_CONTENT_SID_TEST_ANSWER naar:', content.sid)

  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

createVariableTemplate()
