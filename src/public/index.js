// Try to login with session token
const sessionToken = localStorage.getItem("token");
async function verifyAccessToken() {
  if (sessionToken) {
    return await fetch("/verifySession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ token: sessionToken }),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error("Session invalid");
      } else {
        let content = await response.json();
        document.getElementsByClassName("login-btn")[0].classList.add("hidden");
        document
          .getElementsByClassName("menu-btn")[0]
          .classList.remove("hidden");
        document
          .getElementsByClassName("upload-btn")[0]
          .classList.remove("hidden");
        return await content.permission;
      }
    });
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";

  const units = ["B", "kB", "MB", "GB", "TB"];
  const threshold = 1024;
  let unitIndex = 0;
  let size = bytes;

  while (size >= threshold && unitIndex < units.length - 1) {
    size /= threshold;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

async function updateQuotaDisplay() {
  let quota_result = await fetch("/quota", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ token: sessionToken }),
  });
  let quota_json = await quota_result.json();
  if (quota_json.total !== 0) {
    var quota_text =
      formatBytes(quota_json.used) + " of " + formatBytes(quota_json.total);
    var quota_percent = Math.floor((quota_json.used / quota_json.total) * 100);
  } else {
    var quota_text = formatBytes(quota_json.used) + " of unlimited";
    var quota_percent = 0;
  }
  document.getElementById("quota-text").innerText = quota_text;
  document.getElementById("progress").style.width = quota_percent + "%";
  document.getElementById("percentage-text").innerText = quota_percent + "%";

  // Update progress bar color based on percentage
  const progressElement = document.getElementById("progress");
  progressElement.style.transition =
    "background-color 0.5s ease, background 0.5s ease";

  if (quota_percent > 100) {
    progressElement.style.background =
      "linear-gradient(to right, #f77b5e, #f7e15e)";
  } else if (quota_percent > 90) {
    progressElement.style.background =
      "linear-gradient(to right, #f7e15e, #f7e15e)";
  } else if (quota_percent > 75) {
    progressElement.style.background =
      "linear-gradient(to right, #5ef78c, #f7e15e)";
  } else {
    progressElement.style.background =
      "linear-gradient(to right, #5ef78c, #5ef78c)";
  }

  document.getElementById("quota-container").classList.remove("hidden");
}

async function updateFilesDisplay() {
  document.getElementById("my-files-tbody").innerHTML = "";

  let result = await fetch("/getAllFiles", {
    method: "POST",
    body: JSON.stringify({ token: localStorage.getItem("token") }),
    headers: { "Content-type": "application/json; charset=UTF-8" },
  });
  console.log(result.status);
  let result_json = await result.json();
  for (let file in result_json) {
    let file_data = result_json[file];

    // Decode filename to handle UTF-8 properly
    let decodedName = file_data.name;
    try {
      // If the name is double-encoded, decode it
      decodedName = decodeURIComponent(escape(file_data.name));
    } catch (e) {
      // If decoding fails, use original name
      decodedName = file_data.name;
    }

    // Format file size to human readable format
    let formattedSize = formatBytes(file_data.size);

    // Format date to shorter human readable format (no line breaks)
    let formattedDate =
      new Date(file_data.date).toLocaleDateString("hu-HU", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }) +
      " " +
      new Date(file_data.date).toLocaleTimeString("hu-HU", {
        hour: "2-digit",
        minute: "2-digit",
      });

    // Single table row with all columns including action buttons
    let row = `<tr class="border-b border-[#444] hover:bg-black/20 h-[50px]">
            <td class="px-4 py-2 align-middle whitespace-nowrap">${file_data.code}</td>
            <td class="px-4 py-2 align-middle min-w-[200px]">${decodedName}</td>
            <td class="px-4 py-2 align-middle whitespace-nowrap">${formattedDate}</td>
            <td class="px-4 py-2 align-middle whitespace-nowrap">${formattedSize}</td>
            <td class="px-2 py-2 text-center align-middle">
                <button class="download-button bg-secondary-button text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center mx-auto" 
                        onclick="download('${file_data.code}')" 
                        title="Download">
                    <span class="material-icons-outlined text-lg">download</span>
                </button>
            </td>
            <td class="px-2 py-2 text-center align-middle">
                <button class="delete-button bg-error text-black p-2 rounded-lg hover:opacity-80 transition-opacity w-10 h-10 flex items-center justify-center mx-auto" 
                        onclick="deleteFile('${file_data.code}')" 
                        title="Delete">
                    <span class="material-icons-outlined text-lg">delete</span>
                </button>
            </td>
        </tr>`;

    document
      .getElementById("my-files-tbody")
      .insertAdjacentHTML("beforeend", row);
  }
}

async function download(code) {
  const link = document.createElement("a");
  link.href = "/files/" + code;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Reset animation
  const fileInfoElement = document.getElementById("file-info");
  const downloadBtn = document.getElementById("download-btn");
  fileInfoElement.textContent = "";
  fileInfoElement.classList.remove("opacity-100");
  fileInfoElement.classList.add("opacity-0");
  downloadBtn.classList.remove("mb-5");
}

async function deleteFile(code) {
  let result = await fetch("/delete/" + code, {
    METHOD: "GET",
    headers: {
      Authorization: `${localStorage.getItem("token")}`,
    },
  });
  if (result.status !== 200) {
    console.log("Error while deleting file");
    console.log(result.status);
    let result = await result.json();
    console.log(result.body.message);
  }
  await updateFilesDisplay();
  await updateQuotaDisplay();
}

function redirectToDashboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found in localStorage");
    return;
  }
  console.log("Redirecting to admin dashboard with token:", token);
  location.href = "/admin/dashboard/" + token;
}

let access_level = verifyAccessToken();
updateQuotaDisplay();
updateFilesDisplay();
// Handling the hamburger menu
var burber_open = false;
function switchHamburber() {
  if (burber_open) {
    document.getElementById("hambruber-background").classList.add("hidden");
    document.getElementById("hamburber-menu").classList.add("hidden");
    document.getElementById("hamburber-menu").classList.add("hidden");
    document.getElementById("my-files").classList.add("hidden");
    document.getElementById("change-password").classList.add("hidden");
    document.getElementById("hamburber-separator").classList.add("hidden");
    document.getElementById("logout-menu-item").classList.add("hidden");
    document.getElementById("admin-dash").classList.add("hidden");
    document.getElementById("register-user").classList.add("hidden");

    burber_open = false;
  } else {
    if (access_level) {
      document
        .getElementById("hambruber-background")
        .classList.remove("hidden");
      document.getElementById("hamburber-menu").classList.remove("hidden");
      document.getElementById("my-files").classList.remove("hidden");
      document.getElementById("change-password").classList.remove("hidden");
      document.getElementById("hamburber-separator").classList.remove("hidden");
      document.getElementById("logout-menu-item").classList.remove("hidden");
      access_level.then((value) => {
        if (value === "admin") {
          document.getElementById("admin-dash").classList.remove("hidden");
          document.getElementById("register-user").classList.remove("hidden");
        }
      });
    }
    burber_open = true;
  }
}
// Logout function

async function logout() {
  fetch("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ token: sessionToken }),
  }).then(async (response) => {
    if (!response.ok) {
      console.log(response);
      console.log("logout failed");
      alert("Logout failed!");
    } else {
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

    // Add subtle animation on input
    e.target.style.transform = "scale(1.1)";
    e.target.style.backgroundColor = "#e8f5e8";
    setTimeout(() => {
      e.target.style.transform = "";
      e.target.style.backgroundColor = "";
    }, 150);

    if (e.target.value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }

    // Check file when all 6 characters are entered
    checkFileExists();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputs[index - 1].focus();
    }
    // Check file exists after backspace
    setTimeout(checkFileExists, 10);
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    let charIndex = 0;
    for (
      let i = index;
      i < inputs.length && charIndex < pastedData.length;
      i++
    ) {
      inputs[i].value = pastedData[charIndex];
      charIndex++;
    }

    // Focus the next empty input or the last one if all are filled
    const nextEmptyIndex = Array.from(inputs).findIndex(
      (input) => input.value === "",
    );
    if (nextEmptyIndex !== -1) {
      inputs[nextEmptyIndex].focus();
    } else {
      inputs[inputs.length - 1].focus();
    }

    // Check file after paste
    checkFileExists();
  });
});

// User registration form handler
document
  .getElementById("registerUserForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const isAdmin = document.getElementById("reg-is-admin").checked;
    const quota = document.getElementById("reg-quota").value;
    const token = localStorage.getItem("token");

    // Clear previous messages
    document.getElementById("register-error-label").innerText = "";
    document.getElementById("register-success-label").innerText = "";

    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          username: username,
          password: password,
          isAdmin: isAdmin,
          quota: quota,
          token: token,
        }),
      });

      const result = await response.json();

      if (response.status === 200) {
        document.getElementById("register-success-label").innerText =
          "User registered successfully!";
        // Clear form
        document.getElementById("reg-username").value = "";
        document.getElementById("reg-password").value = "";
        document.getElementById("reg-is-admin").checked = false;
        document.getElementById("reg-quota").value = "52428800";
        // Close modal after 2 seconds
        setTimeout(() => {
          document
            .getElementById("register-user-background")
            .classList.add("hidden");
          document.getElementById("register-success-label").innerText = "";
        }, 2000);
      } else {
        document.getElementById("register-error-label").innerText =
          result.error || "Registration failed!";
      }
    } catch (err) {
      console.error("Registration error:", err);
      document.getElementById("register-error-label").innerText =
        "Network error. Please try again.";
    }
  });

// Function to check if file exists and display filename or "Check ID"
async function checkFileExists() {
  const fullCode = Array.from(inputs)
    .map((input) => input.value)
    .join("");

  const fileInfoElement = document.getElementById("file-info");
  const downloadBtn = document.getElementById("download-btn");

  if (fullCode.length === 6) {
    try {
      const response = await fetch("/checkFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ code: fullCode }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.exists) {
          let filename = result.filename;
          fileInfoElement.textContent = filename;
          fileInfoElement.style.color = "#5ef78c";
        } else {
          fileInfoElement.textContent = "Check ID";
          fileInfoElement.style.color = "#f77b5e";
        }

        // Animate: add margin to button and show text
        downloadBtn.classList.add("mb-5");
        fileInfoElement.classList.remove("opacity-0");
        fileInfoElement.classList.add("opacity-100");
      } else {
        fileInfoElement.textContent = "Check ID";
        fileInfoElement.style.color = "#f77b5e";

        // Animate: add margin to button and show text
        downloadBtn.classList.add("mb-5");
        fileInfoElement.classList.remove("opacity-0");
        fileInfoElement.classList.add("opacity-100");
      }
    } catch (error) {
      console.error("Error checking file:", error);
      fileInfoElement.textContent = "Check ID";
      fileInfoElement.style.color = "#f77b5e";

      // Animate: add margin to button and show text
      downloadBtn.classList.add("mb-5");
      fileInfoElement.classList.remove("opacity-0");
      fileInfoElement.classList.add("opacity-100");
    }
  } else {
    // Hide text and remove margin when not 6 characters
    fileInfoElement.textContent = "";
    fileInfoElement.classList.remove("opacity-100");
    fileInfoElement.classList.add("opacity-0");
    downloadBtn.classList.remove("mb-5");
  }
}

inputs[0].focus();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fullCode = Array.from(inputs)
    .map((input) => input.value)
    .join("");
  if (fullCode.length === 6) {
    // Success animation
    inputs.forEach((input, index) => {
      setTimeout(() => {
        input.classList.add("animate-bounce-gentle");
        input.style.backgroundColor = "#5ef78c";
        setTimeout(() => {
          input.classList.remove("animate-bounce-gentle");
          input.style.backgroundColor = "";
        }, 600);
      }, index * 50);
    });

    setTimeout(() => {
      const link = document.createElement("a");
      link.href = "/files/" + fullCode;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      form.reset();

      // Reset animation
      const fileInfoElement = document.getElementById("file-info");
      const downloadBtn = document.getElementById("download-btn");
      fileInfoElement.textContent = "";
      fileInfoElement.classList.remove("opacity-100");
      fileInfoElement.classList.add("opacity-0");
      downloadBtn.classList.remove("mb-5");
    }, 400);
  } else {
    // Error animation
    inputs.forEach((input, index) => {
      setTimeout(() => {
        input.classList.add("animate-shake");
        input.style.backgroundColor = "#f77b5e";
        setTimeout(() => {
          input.classList.remove("animate-shake");
          input.style.backgroundColor = "";
        }, 500);
      }, index * 30);
    });
    alert("Error: Please enter exactly 6 lowercase letters.");
  }
});

// Upload section
let dropZone = document.getElementById("drop_zone");

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
  dropZone.style.transform = "scale(1.05)";
  dropZone.style.backgroundColor = "rgba(103, 146, 255, 0.1)";
});
dropZone.addEventListener("dragleave", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  dropZone.style.transform = "";
  dropZone.style.backgroundColor = "";
  dropZone.style.borderColor = "";
});
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  dropZone.style.transform = "";
  dropZone.style.backgroundColor = "";
  dropZone.style.borderColor = "";
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
  document.getElementById("upload-status-box").classList.remove("hidden");
  document.getElementById("upload-status-box").style.display = "flex";
  document
    .getElementById("upload-status-symbol")
    .classList.add("animate-spin-slow");
  document.getElementById("upload-status-symbol").innerText = "hourglass_empty";
  document
    .getElementById("upload-status-text")
    .classList.add("animate-pulse-slow");
  document.getElementById("upload-status-text").innerText = "Working...";
  document
    .getElementById("upload-close-btn")
    .addEventListener("click", (event) => {
      location.reload();
    });
  const formData = new FormData();
  formData.append("file", files[0]);

  const response = await fetch("/upload", {
    method: "POST",
    headers: {
      Authorization: `${localStorage.getItem("token")}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Upload failed:", error.error);
    document
      .getElementById("upload-status-symbol")
      .classList.remove("animate-spin-slow");
    document
      .getElementById("upload-status-text")
      .classList.remove("animate-pulse-slow");
    document
      .getElementById("upload-status-symbol")
      .classList.add("animate-shake");
    document
      .getElementById("upload-status-text")
      .classList.add("animate-shake");
    document.getElementById("upload-status-symbol").innerText = "error";
    console.log(response.status);
    if (response.status == 400) {
      document.getElementById("upload-status-text").innerText = "Bad request!";
    } else if (response.status == 401) {
      document.getElementById("upload-status-text").innerText = "Unauthorized!";
    } else if (response.status == 413) {
      document.getElementById("upload-status-text").innerText =
        "File too large! You ran out of quota!";
    } else if (response.status == 500) {
      document.getElementById("upload-status-text").innerText =
        "Internal Server Error!";
    } else {
      document.getElementById("upload-status-text").innerText =
        "Unknown Error!";
    }
    return;
  } else {
    document
      .getElementById("upload-status-symbol")
      .classList.remove("animate-spin-slow");
    document
      .getElementById("upload-status-text")
      .classList.remove("animate-pulse-slow");
    document
      .getElementById("upload-status-symbol")
      .classList.add("animate-bounce-gentle");
    document
      .getElementById("upload-status-text")
      .classList.add("animate-bounce-gentle");
    document.getElementById("upload-status-symbol").innerText = "check";
    document.getElementById("upload-status-text").innerText =
      "Upload successful!";
    let response_data = await response.json();
    console.log(response_data);

    // Show success content
    document.getElementById("success-content").classList.remove("hidden");
    document.getElementById("filecode-display").innerText = response_data.code;

    const base_url = location.href;
    const full_url = base_url + "files/" + response_data.code;
    document.getElementById("link-text").innerText = full_url;

    // Copy code functionality
    document
      .getElementById("filecode-display")
      .addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(response_data.code);

          // Visual feedback
          const element = e.target;
          const originalColor = element.style.color;
          element.style.color = "#5ef78c";
          element.style.transform = "scale(1.1)";
          element.style.transition = "all 0.3s ease";

          setTimeout(() => {
            element.style.color = originalColor;
            element.style.transform = "scale(1)";
          }, 800);
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      });

    // Copy link functionality
    document
      .getElementById("copy-link-btn")
      .addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(full_url);
          showCopyFeedback(e.target.closest("button"), "Link copied!");
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      });

    // Copy on click of URL text
    document
      .getElementById("link-text")
      .addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(full_url);
          showCopyFeedback(e.target, "Link copied!");
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      });

    await updateQuotaDisplay();
  }
}

// Function to show copy feedback
function showCopyFeedback(element, message) {
  const tooltip = element.querySelector(".tooltip") || element;
  const originalText = tooltip.textContent;
  tooltip.textContent = message;
  tooltip.style.backgroundColor = "#5ef78c";
  tooltip.style.color = "#000";

  setTimeout(() => {
    tooltip.textContent = originalText;
    tooltip.style.backgroundColor = "";
    tooltip.style.color = "";
  }, 2000);
}

document
  .getElementById("changePasswordForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // Show confirmation popup
    const confirmed = confirm(
      "WARNING: This will log out all logged in instances! Are you sure you want to continue?",
    );
    if (!confirmed) {
      return; // User cancelled the operation
    }

    const old_password = document.getElementById("old-password").value;
    const new_password = document.getElementById("new-password").value;

    try {
      const response = await fetch("/userChangePassword", {
        method: "POST",
        body: JSON.stringify({
          token: localStorage.getItem("token"),
          cur_password: old_password,
          new_password: new_password,
        }),
        headers: { "Content-type": "application/json; charset=UTF-8" },
      });
      const json = await response.json();
      if (response.status === 200) {
        document.getElementById("change-password-label").innerText =
          json.message;
        location.reload();
      }
      if (response.status === 400) {
        document.getElementById("change-password-label").innerText =
          json.message;
      }
      if (response.status === 401) {
        document.getElementById("change-password-label").innerText =
          json.message;
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  });

// Login and store session token
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // This stops the page from refreshing!

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        body: JSON.stringify({ username: username, password: password }),
        headers: { "Content-type": "application/json; charset=UTF-8" },
      });
      const json = await response.json();
      if (response.status === 200) {
        localStorage.setItem("token", json.token);
        location.reload();
      }
      if (response.status === 401) {
        document.getElementById("login-error-label").innerText =
          "Login Failed! Invalid Credentials";
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  });
