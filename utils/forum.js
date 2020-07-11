const fetch = require('node-fetch');
const FormData = require('form-data');

const URI = `https://control.thetechhaven.com/api`
const FORUMS_TOKEN = process.env.FORUMS_TOKEN


const createThread = async (nodeID, title, description) => {
  console.log("Create Thread called")
  const data = new FormData();
  data.append(`node_id`, nodeID);
  data.append(`title`, title);
  data.append(`message`, description);

  const r = await fetch(`${URI}/threads`, {
    method: 'POST',
    body: data,
    headers: {
      'XF-Api-Key': FORUMS_TOKEN
    }
  })

  const response = await r.json();

  if (response.errors) {
    console.log("ERRORS!" + response.errors)
  }

  return response;
}

exports.createThread = createThread