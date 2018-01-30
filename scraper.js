const fs = require('fs');
const folder = './data';
const Crawler = require("crawler");
let homePage = true;
const homeUrl = 'http://shirts4mike.com/shirts.php';
let urlArray = [];
let shirtArray = [];
let $ = '';

/* Function to write the error message and the time stamp to the log file.
*/
function logError(error) {

  let errMessage = `${Date()} ${error}\r\n`;
  console.log(error);
  fs.appendFile('scraper-error.log', errMessage, (err) => {
    if (err) throw err;
    console.log('The error message was appended to the file!');
  });
}

/*Function to generate CSV from shirtArray using the npm package jsonexport. It then writes the data to the CSV file.
*/
function generateCSV() {

  var jsonexport = require('jsonexport');
  var date = new Date();
  date = `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`;

  jsonexport(shirtArray,function(err, csv){
    if(err) return logError("There was an error exporting JSON to CSV");

    fs.writeFile(`./data/${date}.csv`, csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    });

  });

}

/* Function to load the urlArray by looping through the list items in the home page. It then calls the function
scrapeData to get the details of each shirt.
*/
function loadUrlArray() {

  $('a','.products').each(function(i, elem) {
    urlArray[i] = $(this).attr('href');
    scrapeData(`http://shirts4mike.com/${urlArray[i]}`);
  });

}

/*Function to load the shirtArray with the shirt details. When the shirt count reaches 8, function generateCSV is called.
*/
function loadShirtArray(url) {

    let shirt = {
      title: $('title').text(),
      price: $('.price').text(),
      imageURL: $('img', '.shirt-picture').attr('src'),
      URL: url,
      time: Date()
    };

    shirtArray.push(shirt);

    if (shirtArray.length === 8) {
      generateCSV();
    }

}

/*Function to connect to the site 'http://shirts4mike.com/shirts.php' and scrape date
  using the npm package crawler
*/

function scrapeData(url) {

  let c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if (error){
          logError("There was an error connecting to http://shirts4mike.com ");
        }
        else {
          $ = res.$;
          // $ is Cheerio by default
          //a lean implementation of core jQuery designed specifically for the server

          if (homePage) {
            homePage = false;
            loadUrlArray();
           }
           else {
            loadShirtArray(url);
           }

        }
        done();
    }
  });

  // Queue just one URL, with default callback
  c.queue(url);
}

//Check whether the data folder exixts. If the folder doesn't exist create the folder. If the folder exists, check whether
//the CSV file exists and delete that file from the data folder.

if (!fs.existsSync(folder)){
    fs.mkdirSync(folder);
}
else {
  fs.readdir(folder, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(`${folder}/${file}`, err => {
      if (err) throw err;
    });
  }
});
}

scrapeData(homeUrl);
