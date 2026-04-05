const data = JSON.parse(localStorage.getItem("bimData"))

if (!data) {
  document.body.innerHTML = "<h2>No data found</h2>"
}

const clashes = data.clashes

// SUMMARY
document.getElementById("summary").innerHTML = `
  <p>Total Clashes: ${clashes.length}</p>
`

// TABLE
const tableBody = document.getElementById("tableBody")

clashes.forEach(c => {
  const row = `
    <tr>
      <td>${c.id}</td>
      <td>${c.a}</td>
      <td>${c.b}</td>
      <td>${c.type}</td>
      <td>${c.reroute.direction}</td>
    </tr>
  `
  tableBody.innerHTML += row
})

// REROUTE DETAILS
const rerouteDiv = document.getElementById("reroute")

clashes.forEach(c => {
  rerouteDiv.innerHTML += `
    <p>
      ${c.a} vs ${c.b} → Move ${c.reroute.direction} by ${c.reroute.distance}
    </p>
  `
})