const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");

app.use(express.static("public"));

let globalVersion = 0;
let companies = {
  aviation: { subscribers: 0 },
  shipping: { subscribers: 0 },
  renting: { subscribers: 0 },
};

app.get("/", (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  res.status(200).send(html);
});

app.get("/subscribe/:companyId", (req, res) => {
  console.log(`Subscribe to: ${req.params.companyId}`);
  companies[req.params.companyId].subscribers++;
  globalVersion++;
  res
    .status(200)
    .json({ message: `subscribed to company ${req.params.companyId}` });
});

app.get("/sse", (req, res) => {
  // Required headers for event stream
  res.set("Content-Type", "text/event-stream");
  res.set("Connection", "keep-alive");
  res.set("Cache-Control", "no-cache");
  res.set("Access-Control-Allow-Origin", "*");

  console.log("Client connected to SSE");

  // Events are being sent to the client with an interval here
  feedClient(req, res);
});

app.listen(8080, (err) => {
  if (err) {
    console.log("Server cannot listen ...");
    return;
  }
  console.log("Listening on 8080");
});

function feedClient(req, res) {
  let localVersion = 0;
  let eventId = 1;
  const trigger = setInterval(() => {
    // If local version reaches 3, stop feeding
    if (localVersion === 3) {
      console.log("This is the last event sent to the client");
      // \n should be used between different event properties and \n\n at the end for event itself
      res.status(200).write(`id: -1\ndata:\n\n`);
      res.end();
      clearInterval(trigger);
    }
    // Feed client till local version be 3
    else {
      // Check if it is a new event
      if (localVersion < globalVersion) {
        // \n should be used between different event properties and \n\n at the end for event itself
        // id and data are two properties, id for uniqe event id, data for event payload
        res
          .status(200)
          .write(`id: ${eventId}\ndata: ${JSON.stringify(companies)}`);
        res.write("\n\n");
        localVersion = globalVersion;
        eventId++;
      }
    }
  }, 1000);
}
