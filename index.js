console.log("Resume parser API is starting...")

const express=require("express")
const bodyParser = require("body-parser")
const port=process.env.PORT || 3000
const path=require("path")
const multer=require("multer")
const fs=require("fs")

const app=express()
app.set("view engine","ejs")
app.engine('ejs', require('ejs').__express)
app.use(bodyParser.json())
app.use(express.static('public'))
app.use(express.json());
app.use(bodyParser.urlencoded({
    extended:true
}))

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, file.originalname);
    },
  });

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "docx") {
        cb(null, true);
    } else {
        cb(new Error("Not a docx File!!"), false);
    }
};

const upload = multer({
    storage: multerStorage,
})

app.get('/',(req,res)=>{
    res.render("index")
})

app.post('/api/v1/uploadresume',upload.single("resume"), (req,res)=>{
    fs.readdir('compiled',(err,files)=>{// reading the folder compiled
        if(err)
            throw err;
        
        for(const file of files){ // iterating through the list of files
            fs.unlink(path.join('compiled', file), (err) => {
                if (err) 
                    throw err;
              });
        }
    })
    console.log(req.file)
    const resumeparser=require("./app.js");
    res.redirect('/')

})

app.get('/api/v1/viewresume',(req,res)=>{
    fs.readdir('public',(err,files)=>{// reading the folder compiled
        if(err)
            throw err;
        
        for(const file of files){ // iterating through the list of files
            fs.unlink(path.join('public', file), (err) => {
                if (err) 
                    throw err;
              });
        }
    })
    fs.readdir('compiled',(err,files)=>{// reading the folder compiled
        if(err)
            throw err;
        
        for(const file of files){ // iterating through the list of files

            fs.readFile(path.join("compiled",file), "utf8", (err, jsonString) => { //obtaining individual files
                if (err) {
                  console.log("File read failed:", err);
                  return;
                }
                //parsing string now
                try {
                    const candidate=JSON.parse(jsonString)
                    res.render("index",{
                        resume:candidate
                    })
                } catch (error) {
                    console.log("error in parsing string",err)
                }
            })
        }
    })
})


app.listen(port,()=>console.log(`server running on ${port}...`))


