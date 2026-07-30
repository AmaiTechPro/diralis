import { profileDataset } from "../services/profiler/profileDataset";


const employeeDataset = [

  {
    name: "Brian",
    age: 22,
    department: "Engineering",
    salary: 70000,
    joined: "2025-01-10"
  },


  {
    name: "Alice",
    age: 25,
    department: "Finance",
    salary: 85000,
    joined: "2025-02-15"
  },


  {
    name: "David",
    age: null,
    department: "Engineering",
    salary: 90000,
    joined: "2025-03-20"
  },


  {
    name: "Brian",
    age: 22,
    department: "Engineering",
    salary: 70000,
    joined: "2025-01-10"
  }

];



const result =
  profileDataset(employeeDataset);



console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);

