function openFile() {
  document.getElementById("fileInput").click()
}

document.getElementById("fileInput").addEventListener("change", async function() {
  const file = this.files[0]

  const formData = new FormData()
  formData.append("file", file)

  document.getElementById("status").innerText = "Uploading..."

  try {
    const res = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData
    })

    const data = await res.json()

    // STORE DATA (IMPORTANT)
    localStorage.setItem("bimData", JSON.stringify(data))

    document.getElementById("status").innerText = "Processed ✅"

    // Redirect
    window.location.href = "results.html"

  } catch (err) {
    document.getElementById("status").innerText = "Error ❌"
  }
})