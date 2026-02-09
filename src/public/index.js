// Try to login with session token
const sessionToken = localStorage.getItem("token");
async function verifyAccessToken() {
    if (sessionToken) {
        return await fetch("/verifySession", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            },
            body: JSON.stringify({ token: sessionToken })
        })
            .then(async response => {
                if (!response.ok) {
                    throw new Error("Session invalid");
                } else {
                    let content = await response.json();
                    document.getElementsByClassName("login-btn")[0].classList.add("hidden");
                    document.getElementsByClassName("menu-btn")[0].classList.remove("hidden");
                    document.getElementsByClassName("upload-btn")[0].classList.remove("hidden");
                    return await content.permission
                }
            })
    }
}

async function updateQuotaDisplay() {
    let quota_result = await fetch("/quota", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({token:sessionToken})
    })
    let quota_json = await quota_result.json();
    if (quota_json.total !== 0) {
        var quota_text = Math.floor(quota_json.used.total_used / 1000000) + " MB of " + Math.floor(quota_json.total / 1000000) + " MB";
        var quota_percent = Math.floor(quota_json.used.total_used / quota_json.total *100);
    }
    else {
        var quota_text = Math.floor(quota_json.used.total_used / 1000000) + " MB of unlimited ";
        var quota_percent = 75
    }
    document.getElementById("quota-text").innerText = quota_text
    document.getElementById("progress").style.width = quota_percent + "%"
    document.getElementById("percentage-text").innerText = quota_percent + "%"
    
    // Update progress bar color based on percentage
    const progressElement = document.getElementById("progress");
    if (quota_percent <= 100 ) { progressElement.style.backgroundColor = "#f77b5e"; }
    if (quota_percent <= 90 ) { progressElement.style.backgroundColor = "#f7e15e"; }
    if (quota_percent <= 75 ) { progressElement.style.backgroundColor = "#5ef78c"; }

    document.getElementById("quota-container").classList.remove("hidden");
}

async function updateFilesDisplay() {
    document.getElementById("my-files-table").innerHTML = "";
    document.getElementById("my-files-table").insertAdjacentHTML('beforeend', `<tr>
            <th>Code</th>
            <th>Filename</th>
            <th>Added On</th>
            <th>Size</th>
            <th>Type</th>
            <th>Download</th>
            <th>Delete</th>
          </tr>`);
    let result = await fetch("/getAllFiles",{
        method: "POST",
        body: JSON.stringify({token:localStorage.getItem("token")}),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
    console.log(result.status)
    let result_json = await result.json();
    for (let file in result_json) {
        let file_data = result_json[file];
        let html_code = `<tr>
            <td>${file_data.code}</td>
            <td>${file_data.name}</td>
            <td>${file_data.date}</td>
            <td>${file_data.size}</td>
            <td>${file_data.mimetype}</td>
            <td><button class="download-button" onclick=download("${file_data.code}")>Download</button></td>
            <td><button class="delete-button" onclick=deleteFile("${file_data.code}")>Delete</button></td>
            </tr>`
        document.getElementById("my-files-table").insertAdjacentHTML('beforeend', html_code);
        //console.log(file_data);
    }
}

async function download(code) {
    const link = document.createElement("a");
    link.href = "/files/"+code;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    form.reset()
}

async function deleteFile(code) {
    let result = await fetch("/delete/"+code,{
        METHOD: "GET",
        headers: {
            Authorization: `${localStorage.getItem("token")}`,
        }
    })
    if (result.status !== 200) {
        console.log("Error while deleting file");
        console.log(result.status);
        let result = await result.json();
        console.log(result.body.message)
    }
    await updateFilesDisplay();
    await updateQuotaDisplay();
}

let access_level = verifyAccessToken();
updateQuotaDisplay()
updateFilesDisplay()
// Handling the hamburger menu
var burber_open = false
function switchHamburber(){
    if (burber_open) {
        document.getElementById("hambruber-background").classList.add("hidden");
        document.getElementById("hamburber-menu").classList.add("hidden");
        document.getElementById("hamburber-menu").classList.add("hidden");
        document.getElementById("my-files").classList.add("hidden");
        document.getElementById("change-password").classList.add("hidden");
        document.getElementById("hamburber-separator").classList.add("hidden");
        document.getElementById("logout-menu-item").classList.add("hidden");
        document.getElementById("admin-dash").classList.add("hidden");

        burber_open = false;
    }
    else {
        if (access_level) {
            document.getElementById("hambruber-background").classList.remove("hidden");
            document.getElementById("hamburber-menu").classList.remove("hidden");
            document.getElementById("my-files").classList.remove("hidden");
            document.getElementById("change-password").classList.remove("hidden");
            document.getElementById("hamburber-separator").classList.remove("hidden");
            document.getElementById("logout-menu-item").classList.remove("hidden");
            access_level.then(value => {
                if (value === "admin"){
                    document.getElementById("admin-dash").classList.remove("hidden");
                }
            })
        }
        burber_open = true;
    }
}
// Logout function

async function logout(){
    fetch("/logout", {
        method: "POST",
        headers: {"Content-Type": "application/json; charset=UTF-8"},
        body: JSON.stringify({ token: sessionToken })
    }).then(async response => {
        if (!response.ok) {
            console.log(response);
            console.log("logout failed");
            alert("Logout failed!");
        }
        else {
            localStorage.removeItem("token");
            location.reload();
        }
    });
}

// Sets up the download input logic
const inputs = document.querySelectorAll(".code-input");
const form = document.getElementById("downloadForm");

inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
        e.target.value = e.target.value.toLowerCase().replace(/[^a-z]/g, "");

        if (e.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && e.target.value === "" && index > 0) {
            inputs[index - 1].focus();
        }
    });

    input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").toLowerCase().replace(/[^a-z]/g, "");
        
        let charIndex = 0;
        for (let i = index; i < inputs.length && charIndex < pastedData.length; i++) {
            inputs[i].value = pastedData[charIndex];
            charIndex++;
        }
        
        // Focus the next empty input or the last one if all are filled
        const nextEmptyIndex = Array.from(inputs).findIndex(input => input.value === "");
        if (nextEmptyIndex !== -1) {
            inputs[nextEmptyIndex].focus();
        } else {
            inputs[inputs.length - 1].focus();
        }
    });
});

inputs[0].focus();

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fullCode = Array.from(inputs)
        .map((input) => input.value)
        .join("");
    if (fullCode.length === 6) {
        const link = document.createElement("a");
        link.href = "/files/"+fullCode;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        form.reset()
    } else {
        alert("Error: Please enter exactly 6 lowercase letters.");
    }
});

// Upload section
let dropZone = document.getElementById("drop_zone");

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    let files = event.dataTransfer.files;
    handleFiles(files);
});
dropZone.addEventListener("click", (event) => {
    event.preventDefault();
    dropZone.classList.add("select");
    let input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
        let files = e.target.files;
        handleFiles(files);
        dropZone.classList.remove("select");
    };
    input.oncancel = (event) => {
        dropZone.classList.remove("select");
    };
    input.click();
});

async function handleFiles(files) {
    document.getElementById("drop_zone").style.display = "none";
    document.getElementById("upload-status-box").style.display = "flex";
    document.getElementById("upload-status-symbol").classList.add("yellow-working");
    document.getElementById("upload-status-symbol").innerText = "construction";
    document.getElementById("upload-status-text").classList.add("yellow-working");
    document.getElementById("upload-status-text").innerText = "Working...";
    document.getElementById("upload-close-btn").addEventListener("click", (event) => {location.reload();});
    const formData = new FormData();
    formData.append("file", files[0]);

    const response = await fetch("/upload", {
        method: "POST",
        headers: {
            Authorization: `${localStorage.getItem("token")}`,
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Upload failed:", error.error);
        document.getElementById("upload-status-symbol").classList.remove("yellow-working");
        document.getElementById("upload-status-text").classList.remove("yellow-working");
        document.getElementById("upload-status-symbol").classList.add("red-error");
        document.getElementById("upload-status-text").classList.add("red-error");
        document.getElementById("upload-status-symbol").innerText = "error";
        console.log(response.status);
        if (response.status == 400) {document.getElementById("upload-status-text").innerText = "Bad request!";}
        else if (response.status == 401) {document.getElementById("upload-status-text").innerText = "Unauthorized!";}
        else if (response.status == 413) {document.getElementById("upload-status-text").innerText = "File too large! You ran out of quota!";}
        else if (response.status == 500) {document.getElementById("upload-status-text").innerText = "Internal Server Error!";}
        else {document.getElementById("upload-status-text").innerText = "Unknown Error!";}
        return;
    }
    else {
        document.getElementById("upload-status-symbol").classList.remove("yellow-working");
        document.getElementById("upload-status-text").classList.remove("yellow-working");
        document.getElementById("upload-status-symbol").classList.add("green-success");
        document.getElementById("upload-status-text").classList.add("green-success");
        document.getElementById("upload-status-symbol").innerText = "check";
        document.getElementById("upload-status-text").innerText = "Upload successful!";
        let response_data = await response.json()
        console.log(response_data)
        document.getElementById("filecode-display").style.display = "flex";
        document.getElementById("filecode-display").innerText=response_data.code;
        document.getElementById("or").style.display = "flex";
        const base_url = location.href;
        document.getElementById("link-display").style.display = "flex";
        document.getElementById("link-text").innerText=base_url+"files/"+response_data.code;
        document.getElementById("copy-icon").addEventListener("click", (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(base_url+"files/"+response_data.code);
            alert("Link copied!");
        });
        await updateQuotaDisplay();
    }
}

document.getElementById("changePasswordForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Show confirmation popup
    const confirmed = confirm("WARNING: This will log out all logged in instances! Are you sure you want to continue?");
    if (!confirmed) {
        return; // User cancelled the operation
    }

    const old_password = document.getElementById("old-password").value;
    const new_password = document.getElementById("new-password").value;

    try {
        const response = await fetch("/userChangePassword", {
            method: "POST",
            body: JSON.stringify({token:localStorage.getItem("token"),cur_password:old_password, new_password:new_password}),
            headers: { "Content-type": "application/json; charset=UTF-8" }
        });
        const json = await response.json();
        if (response.status === 200) {
            document.getElementById("change-password-label").innerText = json.message
            location.reload();
        }
        if (response.status === 400) {
            document.getElementById("change-password-label").innerText = json.message
        }
        if (response.status === 401) {
            document.getElementById("change-password-label").innerText = json.message
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
})

// Login and store session token
document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault(); // This stops the page from refreshing!

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            body: JSON.stringify({ username:username, password:password }),
            headers: { "Content-type": "application/json; charset=UTF-8" }
        });
        const json = await response.json();
        if (response.status === 200) {
            localStorage.setItem("token", json.token);
            location.reload();
        }
        if (response.status === 401) {
            document.getElementById("login-error-label").innerText = "Login Failed! Invalid Credentials";
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
});


