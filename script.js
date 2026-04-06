// Handle file uploads
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('ifcFileInput');
    const uploadBtns = document.querySelectorAll('.upload-btn');
    const dropZone = document.getElementById('dropZone');
    let activeBtn = null;

    // 1. Click upload button to open file man
    uploadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeBtn = btn;
            fileInput.click();
        });
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files, activeBtn);
        // Clear the input so selecting the same file again triggers change event
        fileInput.value = '';
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
        handleFiles(e.dataTransfer.files, null); // Global drop doesn't have a specific button
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
            handleFiles(files, null); // Global paste doesn't have a specific button
        }
    });

    function handleFiles(files, targetBtn) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name.toLowerCase().endsWith('.ifc')) {
                console.log("Uploading file:", file.name);
                
                // Visual feedback on the button if it was a direct click
                if (targetBtn) {
                    const originalText = targetBtn.innerHTML;
                    targetBtn.innerHTML = `Uploading...`;
                    targetBtn.disabled = true;
                    
                    // Simulate upload success
                    setTimeout(() => {
                        targetBtn.innerHTML = `Uploaded: ${file.name}`;
                        targetBtn.style.background = "#15803d"; // Green for success
                        targetBtn.disabled = false;
                    }, 1000);
                } else {
                    alert(`File "${file.name}" uploaded successfully via Drag/Paste!`);
                }
            } else {
                alert(`File "${file.name}" is not a valid .ifc file. Please upload an IFC file.`);
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