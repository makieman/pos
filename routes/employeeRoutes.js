const express = require("express")
const router = express.routes();


const{ createEmployee,getEmployees}  =require('../controllers/employeeController');
const auth =require("../middleware/authMiddleware")
const role =require("../middleware/roleMiddleware")

//Admin creates emplloyee

router.post("/", auth,role(['admin']),createEmployee);
router.get("/",auth,role(['admin','staff']),getEmployees);

module.exports =router;