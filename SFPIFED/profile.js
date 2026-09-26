document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  const sidebarAvatar = document.getElementById("sidebarAvatar");
  const sidebarAvatarImg = document.getElementById("sidebarAvatarImg");
  const sidebarAvatarText = document.getElementById("sidebarAvatarText");
  const sidebarName = document.getElementById("sidebarName");
  const sidebarEmail = document.getElementById("sidebarEmail");
  const navAvatarTop = document.getElementById("navAvatarTop");

  const avatarPreviewBox = document.getElementById("avatarPreviewBox");
  const avatarImagePreview = document.getElementById("avatarImagePreview");
  const avatarInitialsText = document.getElementById("avatarInitialsText");
  const picUrlInput = document.getElementById("picUrlInput");
  const unsavedBadge = document.getElementById("unsavedBadge");

  const profFirstName = document.getElementById("profFirstName");
  const profLastName = document.getElementById("profLastName");
  const profEmail = document.getElementById("profEmail");
  const profDob = document.getElementById("profDob");
  const profPhone = document.getElementById("profPhone");
  const profAddress = document.getElementById("profAddress");

  const profileForm = document.getElementById("profileForm");
  const profileMsg = document.getElementById("profileMsg");
  const discardProfileBtn = document.getElementById("discardProfileBtn");

  const changePasswordForm = document.getElementById("changePasswordForm");
  const passMsg = document.getElementById("passMsg");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const statTotal = document.getElementById("statTotal");
  const statUpcoming = document.getElementById("statUpcoming");
  const statCompleted = document.getElementById("statCompleted");
  const statSpent = document.getElementById("statSpent");
  const emptyReservations = document.getElementById("emptyReservations");
  const reservationsList = document.getElementById("reservationsList");
  const resStatusFilter = document.getElementById("resStatusFilter");
  const resStartDate = document.getElementById("resStartDate");
  const resEndDate = document.getElementById("resEndDate");

  let initialUserData = null;
  let userBookings = [];

  function renderAvatar(url, initials) {
    if (avatarPreviewBox) {
      if (url && url.trim().length > 5) {
        avatarPreviewBox.innerHTML = `<img src="${url.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
      } else {
        avatarPreviewBox.textContent = initials;
      }
    }

    if (sidebarAvatar) {
      if (url && url.trim().length > 5) {
        sidebarAvatar.innerHTML = `<img src="${url.trim()}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        sidebarAvatar.textContent = initials;
      }
    }
  }

  function populateUserUI(user) {
    if (!user) return;

    const fName = user.firstName || "";
    const lName = user.lastName || "";
    const fullName = `${fName} ${lName}`.trim() || "User";
    const email = user.email || "";

    let initials = "SS";
    if (fName && lName) {
      initials = (fName[0] + lName[0]).toUpperCase();
    } else if (fName) {
      initials = fName.substring(0, 2).toUpperCase();
    }

    if (sidebarName) sidebarName.textContent = fullName;
    if (sidebarEmail) sidebarEmail.textContent = email;
    if (navAvatarTop) navAvatarTop.textContent = initials;

    if (profFirstName) profFirstName.value = fName;
    if (profLastName) profLastName.value = lName;
    if (profEmail) profEmail.value = email;

    const details = user.details || {};
    if (profDob) profDob.value = details.dob ? details.dob.split("T")[0] : "";
    if (profPhone) profPhone.value = details.phoneNumber || "";
    if (profAddress) profAddress.value = details.address || "";
    if (picUrlInput) picUrlInput.value = details.pictureUrl || "";

    renderAvatar(details.pictureUrl, initials);

    if (unsavedBadge) unsavedBadge.classList.add("hidden");
  }

  async function loadUserProfile() {
    try {
      const res = await fetch("https://bookingapi.stepacademy.ge/api/users/me", {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          window.location.replace("login.html");
        }
        return;
      }

      const json = await res.json();
      const user = json.data || json;
      initialUserData = user;
      populateUserUI(user);
    } catch (err) {
      console.error("Profile load error:", err);
    }
  }

  loadUserProfile();

  if (picUrlInput) {
    picUrlInput.addEventListener("input", (e) => {
      const initials = (profFirstName.value.trim()[0] || "S") + (profLastName.value.trim()[0] || "S");
      renderAvatar(e.target.value, initials.toUpperCase());
      if (unsavedBadge) unsavedBadge.classList.remove("hidden");
    });
  }

  if (profileForm) {
    profileForm.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", () => {
        if (unsavedBadge) unsavedBadge.classList.remove("hidden");
      });
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (profileMsg) profileMsg.classList.add("hidden");

      const payload = {
        firstName: profFirstName.value.trim(),
        lastName: profLastName.value.trim(),
        details: {
          phoneNumber: profPhone.value.trim() || null,
          address: profAddress.value.trim() || null,
          dob: profDob.value ? new Date(profDob.value).toISOString() : null,
          pictureUrl: picUrlInput.value.trim() || null
        }
      };

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/users", {
          method: "PUT",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();

        if (res.ok) {
          if (unsavedBadge) unsavedBadge.classList.add("hidden");
          if (profileMsg) {
            profileMsg.textContent = "Profile updated successfully!";
            profileMsg.className = "form-message success";
            profileMsg.classList.remove("hidden");

            setTimeout(() => {
              profileMsg.classList.add("hidden");
            }, 3000);
          }
          await loadUserProfile();
        } else {
          if (profileMsg) {
            profileMsg.textContent = resData.detail || resData.message || "Failed to update profile.";
            profileMsg.className = "form-message error";
            profileMsg.classList.remove("hidden");
          }
        }
      } catch (err) {
        if (profileMsg) {
          profileMsg.textContent = "Network error. Please try again.";
          profileMsg.className = "form-message error";
          profileMsg.classList.remove("hidden");
        }
      }
    });
  }

  if (discardProfileBtn) {
    discardProfileBtn.addEventListener("click", () => {
      if (initialUserData) {
        populateUserUI(initialUserData);
      }
    });
  }

  async function loadUserBookings() {
    try {
      let res = await fetch("https://bookingapi.stepacademy.ge/api/bookings/my-bookings", {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        res = await fetch("https://bookingapi.stepacademy.ge/api/bookings", {
          headers: {
            "accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
      }

      if (!res.ok) return;

      const json = await res.json();
      if (Array.isArray(json)) {
        userBookings = json;
      } else if (json && Array.isArray(json.data)) {
        userBookings = json.data;
      } else if (json && json.data && Array.isArray(json.data.items)) {
        userBookings = json.data.items;
      } else {
        userBookings = [];
      }

      renderBookingsStats(userBookings);
      filterAndRenderBookings();
    } catch (err) {
      console.error(err);
    }
  }

  function renderBookingsStats(bookings) {
    if (!statTotal) return;
    const total = bookings.length;
    let upcoming = 0;
    let completed = 0;
    let spent = 0;

    const now = new Date();

    bookings.forEach(b => {
      spent += (b.totalPrice || b.price || 0);
      const end = b.checkOutDate || b.endDate ? new Date(b.checkOutDate || b.endDate) : null;
      if (b.status === "Cancelled") return;
      if (end && end < now) {
        completed++;
      } else {
        upcoming++;
      }
    });

    if (statTotal) statTotal.textContent = total;
    if (statUpcoming) statUpcoming.textContent = upcoming;
    if (statCompleted) statCompleted.textContent = completed;
    if (statSpent) statSpent.textContent = `$${spent.toFixed(2)}`;
  }

  function filterAndRenderBookings() {
    if (!reservationsList || !emptyReservations) return;

    let filtered = [...userBookings];
    const status = resStatusFilter ? resStatusFilter.value : "all";
    const start = resStartDate && resStartDate.value ? new Date(resStartDate.value) : null;
    const end = resEndDate && resEndDate.value ? new Date(resEndDate.value) : null;

    if (status !== "all") {
      filtered = filtered.filter(b => (b.status || "").toLowerCase() === status.toLowerCase());
    }

    if (start) {
      filtered = filtered.filter(b => new Date(b.checkInDate || b.startDate) >= start);
    }

    if (end) {
      filtered = filtered.filter(b => new Date(b.checkOutDate || b.endDate) <= end);
    }

    if (filtered.length === 0) {
      emptyReservations.classList.remove("hidden");
      reservationsList.classList.add("hidden");
      reservationsList.innerHTML = "";
    } else {
      emptyReservations.classList.add("hidden");
      reservationsList.classList.remove("hidden");

      reservationsList.innerHTML = filtered.map(b => `
        <div class="booking-item-card">
          <div class="booking-item-left">
            <img src="${b.roomThumbnail || b.hotelThumbnail || 'https://via.placeholder.com/80'}" class="booking-item-img" alt="Room">
            <div class="booking-details">
              <h4>${b.hotelName || 'Hotel Stay'} - ${b.roomName || 'Room'}</h4>
              <p><i class="fa-regular fa-calendar"></i> ${b.checkInDate ? b.checkInDate.split("T")[0] : ''} &rarr; ${b.checkOutDate ? b.checkOutDate.split("T")[0] : ''}</p>
              <p>Total: <strong>$${b.totalPrice || b.price || 0}</strong></p>
            </div>
          </div>
          <div>
            <span class="booking-status-pill status-${(b.status || 'confirmed').toLowerCase()}">${b.status || 'Confirmed'}</span>
          </div>
        </div>
      `).join("");
    }
  }

  if (resStatusFilter) resStatusFilter.addEventListener("change", filterAndRenderBookings);
  if (resStartDate) resStartDate.addEventListener("change", filterAndRenderBookings);
  if (resEndDate) resEndDate.addEventListener("change", filterAndRenderBookings);

  loadUserBookings();

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (passMsg) passMsg.classList.add("hidden");

      const currentPassword = document.getElementById("curPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        if (passMsg) {
          passMsg.textContent = "New passwords do not match!";
          passMsg.className = "form-message error";
          passMsg.classList.remove("hidden");
        }
        return;
      }

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/users/change-password", {
          method: "PUT",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword
          })
        });

        const resData = await res.json();

        if (res.ok) {
          if (passMsg) {
            passMsg.textContent = "Password changed successfully!";
            passMsg.className = "form-message success";
            passMsg.classList.remove("hidden");
          }
          changePasswordForm.reset();
        } else {
          if (passMsg) {
            passMsg.textContent = resData.detail || resData.message || "Failed to change password.";
            passMsg.className = "form-message error";
            passMsg.classList.remove("hidden");
          }
        }
      } catch (err) {
        if (passMsg) {
          passMsg.textContent = "Network error. Please try again.";
          passMsg.className = "form-message error";
          passMsg.classList.remove("hidden");
        }
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      const confirmed = confirm("Are you sure you want to permanently delete your account?");
      if (!confirmed) return;

      try {
        const res = await fetch("https://bookingapi.stepacademy.ge/api/users/delete-profile", {
          method: "DELETE",
          headers: {
            "accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          alert("Your account has been deleted.");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          sessionStorage.clear();
          window.location.replace("index.html");
        } else {
          alert("Failed to delete account.");
        }
      } catch (err) {
        alert("Network error.");
      }
    });
  }

  const tabs = document.querySelectorAll(".nav-tab[data-tab]");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-tab");
      if (!targetId) return;

      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  document.querySelectorAll(".eye-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.className = "fa-regular fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fa-regular fa-eye";
      }
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.clear();
      window.location.replace("index.html");
    });
  }
});