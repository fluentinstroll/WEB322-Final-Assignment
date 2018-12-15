var fs = require("fs");

const Sequelize = require('sequelize');

var sequelize = new Sequelize(
    'd7ro5rurgmhk6u', 
    'sjlbxmqoinemys', 
    'dcc050d7e88a13ba54ad13f6d3e99aab25cdb2aa6855f576c76f1ecba3e61054', 
    {
    host: 'ec2-54-225-98-131.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
dialectOptions: {
ssl: true
    }
});
/*COME BACK AND FIX FORMATTING ON THESE FUNCTIONS  */
const Employee = sequelize.define("employee", {
    employeeNum: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
  });
  
const Department = sequelize.define("department", {
    departmentId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    departmentName: Sequelize.STRING
  });

  Department.hasMany(Employee, { foreignKey: "department" });

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
        .then(function(Employee){
            resolve();
        }).then(function(Department){
            resolve();
        }).catch(function(){
            reject("unable to sync the database");
        });

    });
}


module.exports.getManagers = function() {
    return new Promise((resolve, reject)=>{
       reject();
    });
};

/*EMPLOYEE FUNCTIONS */
/*new*/
module.exports.addEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {

        employeeData.isManager = (employeeData.isManager) ? true : false;

        for (var prop in employeeData) {
            if(employeeData[prop] == '')
                employeeData[prop] = null;
        }

        Employee.create(employeeData).then(() => {
            resolve();
        }).catch((err)=>{
            console.log(err);
            reject("unable to create employee");
        });

    });

};

module.exports.getAllEmployees = function() {
    return new Promise((resolve, reject)=>{
       sequelize.sync().then(function(){
           resolve(Employee.findAll());
       }).catch(function(){
        reject("No results returned");
       });
});
};

module.exports.getEmployeesByStatus = function(status){
    return new Promise((resolve, reject) =>{
       sequelize.sync().then(function() {
        resolve(Employee.findAll({
            where: {
                status: status
            }
        }));  
    }).catch(function(){
        reject("No results returned");
    })
});
};

module.exports.getEmployeesByDepartment = function(department){
    return new Promise ((resolve, reject)=>{
       sequelize.sync().then(function(){
           resolve(Employee.findAll({
            where: {
                department: department
            }
        }));
       }).catch(function(){
        reject("No results returned");
       });  
});
};

module.exports.getEmployeesByManager = function(manager){
    return new Promise ((resolve, reject)=>{
        sequelize.sync().then(function(){
            resolve(Employee.findAll({
                where: {
                    employeeManagerNum: manager
                }
            }));         
        }).catch(function(){
            reject("No results returned");
        });
});
};

module.exports.getEmployeesByNum = (num) => {
    return new Promise ((resolve, reject) =>{
       sequelize.sync().then(function(){   
        resolve(Employee.findAll({
            where: {
                employeeNum: num
            }
           }));     
       }).catch(function(){
        reject("No results returned");
       })
});
};
/*new & updated from assignment 5 */
module.exports.updateEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {

        employeeData.isManager = (employeeData.isManager) ? true : false;

        for (var prop in employeeData) {
            if (employeeData[prop] == '')
                employeeData[prop] = null;
        }

        Employee.update(employeeData, {
            where: { employeeNum: employeeData.employeeNum } 
        }).then(() => {
            resolve();
        }).catch((e) => {
            reject("unable to update employee");
        });
    });
};
/**delete employees */
module.exports.deleteEmployeeByNum = function(empNum){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(()=>{
            resolve(Employee.destroy({
                where: {employeeNum: empNum}
            }));
        }).catch(()=>{
            reject("unable to delete employee");
        })

    });
}
/*DEPARTMENT FUNCTIONS*/
module.exports.getDepartments = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve(Department.findAll());
        }).catch((err) => {
            reject("no results returned.");
        });
    });
}
/*new*/
module.exports.addDepartment = function (departmentData) {
    return new Promise(function (resolve, reject) {
        for (const i in departmentData) {
            if (departmentData[i] == "") departmentData[i] = null;
        };
        Department.create({
            departmentId: departmentData.departmentId,
            departmentName: departmentData.departmentName
        }).then(() => {
            console.log("New department created successfully");
            resolve(Department[1]);
        }).catch(() => {
            reject("unable to create department");
        });
    });
};
/*new*/
module.exports.updateDepartment = function(departmentData){
    return new Promise((resolve, reject) => {
        // Any blank values in departmentData are set to null 
        sequelize.sync().then(function(){
            for(var prop in departmentData){
                if(departmentData[prop] == ""){
                    departmentData[prop] = null;
                }
            }
            Department.update({
                departmentName: departmentData.departmentName
            }, { where: {departmentId: departmentData.departmentId}});

            resolve(Department);

        }).catch(function(){
            reject("unable to update department");
        });
    });
};
/*new*/
module.exports.getDepartmentById = function(id){
    return new Promise ((resolve, reject) =>{
        sequelize.sync().then(function(){
            resolve(Department.findAll({
             where: {
                 departmentId: id
             }
            }));     
        }).catch(function(){
         reject("No results returned");
        })
 });
}
/*new*/
let deleteDepartmentById = departmentId => {
    return new Promise((resolve, reject) => { 
      Department.destroy({ where: { departmentId: departmentId } })
      .then(data => resolve('Deleted'))
      .catch(err => reject(err));
    });
  };

/*updating departments*/
module.exports.updateDepartmnet = function(departmentData){
    return new Promise((resolve, reject) => {
        // Any blank values in departmentData are set to null 
        sequelize.sync().then(function(){
            for(var prop in departmentData){
                if(departmentData[prop] == ""){
                    departmentData[prop] = null;
                }
            }
            Department.update({
                departmentName: departmentData.departmentName
            }, { where: {departmentId: departmentData.departmentId}});

            resolve(Department);

        }).catch(function(){
            reject("unable to update department");
        });
    });
};
