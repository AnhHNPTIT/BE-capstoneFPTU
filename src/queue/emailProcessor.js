const emailQueue = require('./sendEmailQueue');
const sendEmailConsulation = require('./emailCustomer');
const sendEmail = require('./emailWorker');
const updateChat = require("./message")

emailQueue.process('send-email', async (job) => {
  const { data } = job;
  await sendEmail(data);
});


emailQueue.process('send-customer-consulation', async (job) => {
  const { data } = job;
  await sendEmailConsulation(data);
});

emailQueue.process('update_message', async (job) => {
  const { data } = job;
  await updateChat(data);
});