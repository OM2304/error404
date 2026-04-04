function askAI(){
    let msg = document.getElementById("msg").value;
    let chat = document.getElementById("chat");

    if(!msg) return;

    chat.innerHTML += "<p><b>You:</b> " + msg + "</p>";

    setTimeout(()=>{
        chat.innerHTML += "<p><b>AI:</b> Clash detected between Pipe-101 and Duct-55 (High Risk)</p>";
    },500);

    document.getElementById("msg").value="";
}