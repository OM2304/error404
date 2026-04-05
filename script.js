// Handle file uploads
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('ifcFileInput');
    const uploadBtns = document.querySelectorAll('.upload-btn');
    const dropZone = document.getElementById('dropZone');

    // 1. Click upload button to open file man
    uploadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            fileInput.click();
        });
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 2. Drag and drop functionality
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // 3. Copy and paste functionality
    document.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        const files = [];
        for (let index in items) {
            let item = items[index];
            if (item.kind === 'file') {
                files.push(item.getAsFile());
            }
        }
        if (files.length > 0) {
            handleFiles(files);
        }
    });

    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.toLowerCase().endsWith('.ifc')) {
                console.log("Uploading file:", file.name);
                alert(`File "${file.name}" uploaded successfully!`);
                // Here you would typically send the file to your backend
                // uploadFileToServer(file);
            } else {
                alert(`File "${file.name}" is not a valid .ifc file.`);
            }
        }
    }
});

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