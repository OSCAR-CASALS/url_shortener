require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require("dns");
const { model } = require('mongoose');
const app = express();
let mongoose = require('mongoose');
const { URL } = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// contecting to database

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// body-parser middleware

app.use(bodyParser.urlencoded({extended: false}));


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// has map with short url

// Create url schema

let url_schema = new mongoose.Schema({
  long_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
});

let URL_Model = mongoose.model("url", url_schema); 

async function get_request(req, res){
  let s_url = req.params.url_short;

  let l_url = await URL_Model.findOne({short_url: s_url}, "long_url");

  res.redirect(l_url.long_url);
}

function post_request(req, res){
  /*
  Shorten url giving as input in req
  */

  // retrieve input URL.
  let orig_url = req.body.url;
  
  dns.lookup(new URL(orig_url).hostname, async function(err, data){
    if(err){

      console.log("URL " + orig_url + " could not be found");
      Cont = false;
      res.json({ error: 'invalid url' });

    }else{
      
      let it_exists = await URL_Model.exists({long_url: orig_url});
      
      if(it_exists){
        // return json with original url and shorten one.
        let s_url = await URL_Model.findOne({long_url: orig_url}, "short_url");
        res.json({ original_url: orig_url, short_url: s_url.short_url});
        return ; 

      }else{
        let s_url = await URL_Model.countDocuments();
        s_url += 1;
        const new_url = new URL_Model({
          long_url: orig_url,
          short_url: s_url
        });

        new_url.save();

        res.json({ original_url: orig_url, short_url: s_url});

        return ;
      }

    }
  });
}

app.route("/api/shorturl/:url_short?").get(get_request).post(post_request);
