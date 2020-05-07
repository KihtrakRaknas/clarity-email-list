const express = require('express')
const fetch = require('node-fetch');

const app = express()
const dotenv = require('dotenv');
dotenv.config();
var admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
  databaseURL: "https://big-thonk.firebaseio.com"
});
var db = admin.database();
var serverData = db.ref("server-data");

const port = process.env.PORT || 3000
const lists =[
  '32535', //Every day
  '32537', //every 3 days
  '32538' //every week
]
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const mailjet = require ('node-mailjet')
.connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE)

  app.get('/addEmail', async (req, res) => {
    return await mailjet.get("contact", {'version': 'v3'}).id(req.query.email).request().then((result) => { //check if email exists
      console.log(result.body.Data[0].ID)
      updateMailList(result.body.Data[0].ID, req.query.list,res)
    })
    .catch((err) => {
      mailjet.post("contact", {'version': 'v3'}).request({"IsExcludedFromCampaigns":"false","Email":req.query.email}).then((result) => {//Create new contact
        console.log(result.body.Data[0].ID)
        updateMailList(result.body.Data[0].ID, req.query.list,res)
      })
      .catch((err) => {
        console.log(err)
        res.json({err:"Something went wrong. Err code: "+err.statusCode})
        console.log(err.statusCode)
      })
    })

  });


function updateMailList(id,reqList,res){
  let listObj = lists.map((list)=>{
    if(list == reqList)
      return({
        "Action":"addforce",
        "ListID":""+reqList
      })
    return({
      "Action":"remove",
      "ListID":list
    })
  })
  console.log("subing")
  mailjet
	.post("contact", {'version': 'v3'})
	.id(id)
	.action("managecontactslists")
	.request({
      "ContactsLists":listObj
  }).then((result) => {
    console.log(result.body)
    res.json({done:"done"})
	})
	.catch((err) => {
    console.log(err)
    res.json({err:"Something went wrong. Err code: "+err.statusCode})
		console.log(err.statusCode)
	})

}


app.listen(port, () => console.log(`Example app listening on port ${port}!`))


app.use(express.static('./'));