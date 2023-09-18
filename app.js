const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


const mongodbUri = process.env.MONGODB_URI;
const port = process.env.PORT;

mongoose.connect(mongodbUri);




const itemSchema = new mongoose.Schema({
  name: String,
});

const customListSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});


const List = mongoose.model("List", customListSchema);

const Item = mongoose.model("Item" , itemSchema);

const defaultItems = [
  new Item({ name: "Hello!, Welcome." }),
];

app.get("/",  async function (req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
  }
});

app.get("/:customList", async function(req, res){
  const customListName = _.capitalize(req.params.customList);

  const foundListName = await List.findOne({name: customListName});

  if(!foundListName){
    const list = new List({
      name: customListName,
      items: defaultItems
    });
  
    list.save();
    res.redirect("/"+customListName);
  } else{
    res.render("list", { listTitle: foundListName.name, newListItems: foundListName.items });
  }




});

app.post("/", async function(req, res){

  const newItem = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: newItem
  });

  if(listName==="Today"){
    await item.save();
    res.redirect("/");
  } else{
    const foundList = await List.findOne({name: listName});
    foundList.items.push(item);
    await foundList.save();
    res.redirect("/"+listName);
  }
});

app.post("/delete", async function(req, res){
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    await Item.findByIdAndDelete({_id: checkedId});
    res.redirect("/");
  }else{
    await List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedId}}});
    res.redirect("/"+listName);
  }

  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(port, function() {
  console.log("Server started on port 3000");
});
