import sendReminderEmails from './sendReminders.js';

async function run() {
  await sendReminderEmails();
  console.log('✅ Done sending reminders!');
}

run();
