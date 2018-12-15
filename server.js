 

var express = require("express");
var app = express();
var path = require("path");
var dataService = require("./data-service.js");
var bodyParser = require('body-parser');
var multer = require("multer");
var path = require("path");
var fs = require("fs");
const exphbs = require('express-handlebars'); // new
const clientSessions = require("client-sessions");
const dataServiceAuth = require("./data-service-auth.js");

var http_port = process.env.PORT || 8080;
/*new*/
dataService.initialize()
.then(dataServiceAuth.initialize())
    .then(function () {
        app.listen(http_port, function () {
            console.log("app listening on: " + http_port)
        });
    }).catch(function (err) {
        console.log("unable to start server: " + err);
});

// new
app.engine(".hbs", exphbs({
    extname: ".hbs",
    defaultLayout: 'main',
    helpers: {
        navLink: (url, options) => {
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        
        equal: (lvalue, rvalue, options) => {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set("view engine", ".hbs");

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});
//new
app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});
/*new*/
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_a6",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));
/*new*/
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});
/*new*/
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } 
    else {
      next();
    }
}

app.get("/", function(req, res) {
    res.render("home"); // new
});

app.get("/about", function(req, res) {
    res.render("about"); // new
});

app.get("/employees", ensureLogin, function(req, res) {
    if(req.query.status){
        dataService.getEmployeesByStatus(req.query.status)
        .then(function(data){
            if (data.length > 0){
            res.render("employees", {employees: data}); // new
            }
        })
        .catch(function(err){
            res.render("employees", {message: "no results"}); // new
        })
    }
    else if(req.query.department){
        dataService.getEmployeesByDepartment(req.query.department)
        .then(function(data){
            res.render("employees", {employees: data}); // new
        })
        .catch(function(err){
            res.render("employees", {message: "no results"}); // new
        })
    }
    else if(req.query.manager){
        dataService.getEmployeesByManager(req.query.manager)
        .then(function(data){
            if(data.length > 0){
            res.render("employees", {employees: data}); // new
            }
        })
        .catch(function(err){
            res.render("employees", {message: "no results"}); // new
        })
    }
    else{
        dataService.getAllEmployees()
        .then(function(data){
            res.render("employees", {employees: data}); // new
        })
        .catch(function(err){
            res.render("employees", {message: "no results"}); // new
        })
    }    
});

app.get("/employees/value", ensureLogin, function(req, res){
    dataService.getEmployeesByNum(req.body)
    .then(function(data){
        res.json(data);
    })
    .catch(function(err){
        res.send(err);
    });
});

app.get("/employees/add", ensureLogin, function(req, res) {
    dataService.getDepartments().then(data => {
        res.render("addEmployee", { departments: data });
    }).catch(data => {
        res.render("addEmployee", { departments: [] });
    })
});

app.post("/employees/add", ensureLogin, function(req, res) {
    dataService.AddEmployee(req.body)
    .then(function(data){
        res.redirect("/employees")
    })
    .catch(function(err){
        res.send(err);
    });
});
// new
app.get("/employee/:empNum", ensureLogin, (req, res) => {

    // initialize an empty object to store the values
    let viewData = {};
/**if there are problems it might be this */
dataService.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
viewData.employee = null; // set employee to null if there was an error 
    }).then(dataService.getDepartments)
.then((data) => {
viewData.departments = data; // store department data in the "viewData" object as "departments"

        // loop through viewData.departments and once we have found the departmentId that matches
        // the employee's "department" value, add a "selected" property to the matching 
        // viewData.departments object

        for (let i = 0; i<viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.employee.department) {
viewData.departments[i].selected = true;
            }
        }

    }).catch(() => {
viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if (viewData.employee == null) { // if no employee - return an error
res.status(404).send("Employee Not Found");
        } else {
res.render("employee", { viewData: viewData }); // render the "employee" view
        }
    });
});


// new
app.post("/employee/update", ensureLogin, function(req, res) {
    dataService.updateEmployee(req.body)
    .then(function() {
      res.redirect("/employees");
    })
    .catch(function(err){
      console.log(err);
    });
});
/**new */
app.get("/employees/delete/:empNum", ensureLogin, (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum)
    .then(function(){
        res.redirect('/employees');
    }).catch(function(data){
        res.status(500).send("Unable to Remove Employee / Employee not found");
    })

});

app.get("/departments", ensureLogin, (req, res) => {
    dataService.getDepartments()
    .then((data) => {
        if (data.length > 0) {
            res.render("departments", {
                departments: data
            });
        } else {
            res.render("departments", {
                message: "no results"
            });
        }
    })
    .catch((err) => {
        res.render("departments", {
            message: "no results"
        });
    })
});
/**new departments/add routes*/
app.get('/departments/add', ensureLogin, function (req, res) {
    res.render('addDepartment');
});

app.post('/departments/add', ensureLogin, function (req, res) {
    dataService.addDepartment(req.body)
    .then(function (data) {
        res.redirect('/departments');

    }).catch(function (data) {
        res.send(data);
    });
});
/**new department/update route*/
app.post('/department/update', ensureLogin, function (req, res) {
    dataService.updateDepartment(req.body)
    .then(function () {
        res.redirect('/departments');
    }).catch(function (data) {
        res.send(data);
    })
});
/**returns departments sorted by id */
app.get('/department/:departmentId', ensureLogin, function (req, res) {
    dataService.getDepartmentById(req.params.departmentId)
    .then(function (data) {
        res.render('department', { department: data });
    }).catch(function (err) {
        res.status(404).send("Department Not Found");
    });
});

app.get('/department/delete/:departmentId', ensureLogin, function (req, res){
    dataService.deleteDepartmentById(req.params.departmentId)
    /**come back to fix delete function */
})

app.get("/images", ensureLogin, function(req, res){
    fs.readdir(__dirname + "/public/images/uploaded", function(err, images){
        res.render("images", {data: images}); //new
    });
});

app.get("/images/add", ensureLogin, function(req, res){
    res.render("addImage");
});

app.post("/images/add", ensureLogin, upload.single("imageFile"), function(req, res) {
    res.redirect("/images");
});


/*login and register get and post functions*/
app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body).then(() => {
        res.render("register", {successMessage: "User Created"});        
    }).catch((err) => {
        res.render("register", {errorMessage: err, userName: JSON.stringify(req.body.userName)});
    })
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,  
            loginHistory: user.loginHistory 
        }
        console.log(req.session.user);
        res.redirect('/employees');
    }).catch((err) => {
        res.render("login", {errorMessage: err, userName: req.body.userName});
    });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});
