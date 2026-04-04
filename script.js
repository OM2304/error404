async function loadClashes() {
    let res = await fetch("http://127.0.0.1:5000/clashes");
    let data = await res.json();

    let table = document.getElementById("clashTable");

    data.forEach(c => {
        let row = table.insertRow();

        row.innerHTML = `
            <td>${c.id}</td>
            <td>${c.type}</td>
            <td>${c.A.element_id}</td>
            <td>${c.B.element_id}</td>
            <td>(${c.location.x.toFixed(1)}, ${c.location.y.toFixed(1)}, ${c.location.z.toFixed(1)})</td>
            <td class="red">${c.status}</td>
        `;
    });
}

function askAI(){
    let msg = document.getElementById("msg").value;
    let chat = document.getElementById("chat");

    if(!msg) return;

    chat.innerHTML += "<p><b>You:</b> " + msg + "</p>";

    fetch("http://127.0.0.1:5000/ask")
    .then(res => res.json())
    .then(data => {
        chat.innerHTML += "<p><b>AI:</b> " + data.response + "</p>";
    });

    document.getElementById("msg").value="";
}

window.onload = loadClashes;