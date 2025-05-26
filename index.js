 //accessing dom element
//1. Using id
let res = document.getElementById("mydiv");
// console.log(res)
console.dir(res)

//2. class
let h2 = document.getElementsByClassName("h2");
console.log(h2);  //list collection
console.log(h2[0])

//3. tag name
let res2 = document.getElementsByTagName("p");
console.log(res2);

//4. Querty Selector
let out = document.querySelector("#mydiv");
let out2 = document.querySelectorAll("p")
console.log(out2);

//document properties
//1. accessing element content and change is 
//* innerHTML
console.log(res.innerHTML) //getter
//res.innerHTML = "<p>change using dom manipulation</p>";
//* innerHTML
console.log(res.innerText)
res.innerText = "Hello world hnji";

//*textcontent
//accessing element class or id or etc
//accessing
console.log(res.)
 //accessing dom element
//1. Using id
let res = document.getElementById("mydiv");
// console.log(res)
console.dir(res)

//2. class
let h2 = document.getElementsByClassName("h2");
console.log(h2);  //list collection
console.log(h2[0])

//3. tag name
let res2 = document.getElementsByTagName("p");
console.log(res2);

//4. Querty Selector
let out = document.querySelector("#mydiv");
let out2 = document.querySelectorAll("p")
console.log(out2);

//document properties
//1. accessing element content and change is 
//* innerHTML
console.log(res.innerHTML) //getter
//res.innerHTML = "<p>change using dom manipulation</p>";
//* innerHTML
console.log(res.innerText)
res.innerText = "Hello world doing this in js file";

//*textcontent
//accessing element class or id or etc
//1. getAttribute
console.log(res.getAttribute("id"))
let btn = document.querySelector(".btn")
btn.addEventListener("click", () =>{
    res.setAttribute("class", "js");
})