
document.addEventListener("DOMContentLoaded", () => {
  const pages = [...document.querySelectorAll(".page")];
  const indicator = document.getElementById("pageIndicator");
  const modals = [...document.querySelectorAll(".modal")];
  const song = document.getElementById("birthdaySong");
  const playButton = document.getElementById("playButton");
  const recordArt = document.getElementById("recordArt");
  const seekBar = document.getElementById("seekBar");
  const currentTime = document.getElementById("currentTime");
  const duration = document.getElementById("duration");
  const toast = document.getElementById("toast");

  const pageLabels = {
    coverPage: "COVER · 01",
    letterPage: "A LETTER · 02",
    giftsPage: "YOUR GIFTS · 03",
    finalPage: "FOR ARUM · 04"
  };

  let currentPage = "coverPage";
  let previousFocus = null;
  let toastTimer;
  let isSeeking = false;

  // ==============================
  // NOTIFIKASI KECIL
  // ==============================

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // ==============================
  // NAVIGASI HALAMAN BUKU
  // ==============================

  function goToPage(pageId) {
    const target = document.getElementById(pageId);

    if (!target || !target.classList.contains("page")) return;
    if (currentPage === pageId) return;

    pages.forEach(page => {
      page.classList.remove("active", "leaving");
      page.setAttribute("aria-hidden", "true");
    });

    target.classList.add("active");
    target.setAttribute("aria-hidden", "false");

    currentPage = pageId;
    indicator.textContent = pageLabels[pageId] || "A LITTLE SURPRISE";

    // Kembalikan posisi teks surat ke awal ketika dibuka kembali.
    if (pageId === "letterPage") {
      const letterCopy = target.querySelector(".letter-copy");
      if (letterCopy) letterCopy.scrollTop = 0;
    }
  }

  document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
      goToPage(button.dataset.go);
    });
  });

  document.getElementById("replayButton").addEventListener("click", () => {
    closeAllModals();
    goToPage("coverPage");
  });

  // ==============================
  // BUKA DAN TUTUP HADIAH
  // ==============================

  function openModal(modalId, trigger) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    previousFocus = trigger || document.activeElement;

    modals.forEach(item => {
      item.classList.remove("open");
      item.setAttribute("aria-hidden", "true");
    });

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeButton = modal.querySelector(".modal-close");
    if (closeButton) closeButton.focus();
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    if (modal.id === "musicModal") {
      song.pause();
      updatePlayButton();
    }

    const anotherOpen = modals.some(item => item.classList.contains("open"));

    if (!anotherOpen) {
      document.body.style.overflow = "";
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    }
  }

  function closeAllModals() {
    modals.forEach(modal => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    });

    song.pause();
    updatePlayButton();
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-modal]").forEach(button => {
    button.addEventListener("click", () => {
      openModal(button.dataset.modal, button);
    });
  });

  modals.forEach(modal => {
    const closeButton = modal.querySelector(".modal-close");

    closeButton.addEventListener("click", () => {
      closeModal(modal);
    });

    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const openModalElement = modals.find(modal =>
        modal.classList.contains("open")
      );

      if (openModalElement) closeModal(openModalElement);
    }
  });

  // Tombol NEXT dari pemutar musik menuju halaman bunga tulip.
  document.querySelectorAll("#musicModal [data-go]").forEach(button => {
    button.addEventListener("click", () => {
      closeAllModals();
      goToPage(button.dataset.go);
    });
  });

  // ==============================
  // PEMUTAR MUSIK
  // ==============================

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function updatePlayButton() {
    const isPlaying = !song.paused && !song.ended;

    playButton.innerHTML = isPlaying
      ? '<i class="fa-solid fa-pause"></i>'
      : '<i class="fa-solid fa-play"></i>';

    playButton.setAttribute(
      "aria-label",
      isPlaying ? "Jeda lagu" : "Putar lagu"
    );

    recordArt.classList.toggle("playing", isPlaying);
  }

  playButton.addEventListener("click", async () => {
    if (song.paused) {
      try {
        await song.play();
      } catch (error) {
        showToast("Lagu belum bisa diputar. Periksa file assets/lagu.mp3.");
      }
    } else {
      song.pause();
    }

    updatePlayButton();
  });

  song.addEventListener("play", updatePlayButton);
  song.addEventListener("pause", updatePlayButton);
  song.addEventListener("ended", updatePlayButton);

  song.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(song.duration);
    seekBar.max = Math.floor(song.duration) || 100;
  });

  song.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(song.currentTime);

    if (!isSeeking) {
      seekBar.value = Math.floor(song.currentTime);
    }
  });

  seekBar.addEventListener("input", () => {
    isSeeking = true;
    currentTime.textContent = formatTime(Number(seekBar.value));
  });

  seekBar.addEventListener("change", () => {
    if (Number.isFinite(song.duration)) {
      song.currentTime = Math.min(
        Number(seekBar.value),
        song.duration
      );
    }

    isSeeking = false;
  });

  song.addEventListener("error", () => {
    showToast("File lagu tidak ditemukan. Periksa nama dan lokasi musik.");
    updatePlayButton();
  });

  // ==============================
  // ANIMASI KELopak BUNGA
  // ==============================

  const petalField = document.getElementById("petalField");
  const petalSymbols = ["✿", "❀", "♡"];

  for (let i = 0; i < 15; i++) {
    const petal = document.createElement("span");

    petal.className = "petal";
    petal.textContent = petalSymbols[i % petalSymbols.length];
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${9 + Math.random() * 12}s`;
    petal.style.animationDelay = `${-Math.random() * 18}s`;
    petal.style.fontSize = `${10 + Math.random() * 13}px`;

    petalField.appendChild(petal);
  }

  // ==============================
  // PEMERIKSAAN FILE FOTO
  // ==============================

  document.querySelectorAll("img").forEach(img => {
    img.addEventListener("error", () => {
      img.style.background = "#f8dce6";
      img.style.objectFit = "contain";
      img.alt = "Foto belum tersedia: " + img.alt;
    });
  });

  // Kondisi awal
  pages.forEach(page => {
    page.setAttribute(
      "aria-hidden",
      page.id === currentPage ? "false" : "true"
    );
  });

  updatePlayButton();
});

/* =====================================================
   CUTE PINK FANTASY — ANIMASI TAMBAHAN
===================================================== */

(() => {
    // Hindari membuat efek dua kali jika script terpanggil ulang.
    if (window.__arumFantasyEffectsLoaded) return;
    window.__arumFantasyEffectsLoaded = true;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // =========================================
    // 1. KELopak BUNGA BERGERAK
    // =========================================

    function createFantasyPetal() {
        if (reduceMotion) return;

        const petal = document.createElement("span");
        petal.className = "fantasy-petal";
        petal.setAttribute("aria-hidden", "true");
        petal.textContent = Math.random() > 0.5 ? "🌸" : "✿";

        petal.style.left = `${Math.random() * 100}%`;
        petal.style.fontSize = `${0.7 + Math.random() * 0.8}rem`;
        petal.style.animationDuration = `${7 + Math.random() * 7}s`;
        petal.style.setProperty(
            "--drift",
            `${Math.round(Math.random() * 180 - 90)}px`
        );
        petal.style.setProperty(
            "--spin",
            `${Math.round(Math.random() * 720 + 180)}deg`
        );

        document.body.appendChild(petal);

        petal.addEventListener("animationend", () => {
            petal.remove();
        }, { once: true });
    }

    if (!reduceMotion) {
        // Jeda antar-kelopak agar layar tidak terlalu penuh.
        window.setInterval(createFantasyPetal, 1100);
    }

    // =========================================
    // 2. KONFETI ULANG TAHUN
    // =========================================

    function launchBirthdayConfetti() {
        if (reduceMotion) return;

        let layer = document.getElementById("confettiLayer");

        if (!layer) {
            layer = document.createElement("div");
            layer.id = "confettiLayer";
            layer.setAttribute("aria-hidden", "true");
            document.body.appendChild(layer);
        }

        // Bersihkan konfeti sebelumnya.
        layer.replaceChildren();

        const colors = [
            "#ff8fba",
            "#ffc2d9",
            "#ffe18a",
            "#e9b5ef",
            "#ffffff",
            "#f58eaa"
        ];

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 90; i++) {
            const piece = document.createElement("span");
            piece.className = "confetti-piece";

            piece.style.left = `${Math.random() * 100}%`;
            piece.style.backgroundColor =
                colors[Math.floor(Math.random() * colors.length)];

            piece.style.setProperty(
                "--fall-time",
                `${2.2 + Math.random() * 2.5}s`
            );

            piece.style.setProperty(
                "--confetti-drift",
                `${Math.round(Math.random() * 240 - 120)}px`
            );

            piece.style.animationDelay = `${Math.random() * 0.8}s`;
            piece.style.width = `${5 + Math.random() * 6}px`;
            piece.style.height = `${8 + Math.random() * 9}px`;

            fragment.appendChild(piece);
        }

        layer.appendChild(fragment);

        window.setTimeout(() => {
            layer.replaceChildren();
        }, 6000);
    }

    // =========================================
    // 3. ANIMASI MUSIK DAN EQUALIZER
    // =========================================

    const birthdaySong = document.getElementById("birthdaySong");
    const recordArt = document.getElementById("recordArt");
    const equalizer = document.getElementById("musicEqualizer");

    function syncMusicAnimation() {
        const isPlaying = birthdaySong && !birthdaySong.paused;

        if (recordArt) {
            recordArt.classList.toggle("is-playing", Boolean(isPlaying));
        }

        if (equalizer) {
            equalizer.classList.toggle("is-playing", Boolean(isPlaying));
        }
    }

    if (birthdaySong) {
        birthdaySong.addEventListener("play", syncMusicAnimation);
        birthdaySong.addEventListener("pause", syncMusicAnimation);
        birthdaySong.addEventListener("ended", syncMusicAnimation);

        syncMusicAnimation();
    }

    // =========================================
    // 4. DETEKSI HALAMAN PENUTUP
    // =========================================

    const finalPage = document.getElementById("finalPage");

    function checkFinalPage() {
        if (finalPage && finalPage.classList.contains("active")) {
            if (!finalPage.dataset.confettiShown) {
                finalPage.dataset.confettiShown = "true";
                launchBirthdayConfetti();
            }
        } else if (finalPage) {
            delete finalPage.dataset.confettiShown;
        }
    }

    if (finalPage) {
        const pageObserver = new MutationObserver(checkFinalPage);

        pageObserver.observe(finalPage, {
            attributes: true,
            attributeFilter: ["class"]
        });

        // Periksa juga jika halaman penutup sudah aktif sejak awal.
        checkFinalPage();
    }

    // =========================================
    // 5. ANIMASI ULANG SAAT SURAT DIBUKA
    // =========================================

    const messageModal = document.getElementById("messageModal");
    const secretLetter = messageModal
        ? messageModal.querySelector(".secret-letter")
        : null;

    if (messageModal && secretLetter) {
        const letterObserver = new MutationObserver(() => {
            const modalIsVisible =
                messageModal.classList.contains("active");

            if (modalIsVisible) {
                secretLetter.style.animation = "none";

                // Memulai ulang animasi tanpa mengubah isi surat.
                void secretLetter.offsetWidth;

                secretLetter.style.animation = "";
            }
        });

        letterObserver.observe(messageModal, {
            attributes: true,
            attributeFilter: ["class"]
        });
    }

    // =========================================
    // 6. KONFETI SAAT HADIAH DIBUKA
    // =========================================

    // Efek kecil saat hadiah dibuka, tanpa mengganggu
    // event handler hadiah yang sudah ada.
    document.querySelectorAll("[data-modal]").forEach((giftButton) => {
        giftButton.addEventListener("click", () => {
            if (reduceMotion) return;

            // Kilauan kecil berupa emoji hati.
            const sparkle = document.createElement("span");
            sparkle.textContent = "♡";
            sparkle.setAttribute("aria-hidden", "true");

            Object.assign(sparkle.style, {
                position: "fixed",
                left: `${Math.random() * 70 + 15}%`,
                top: `${Math.random() * 60 + 20}%`,
                zIndex: "9998",
                pointerEvents: "none",
                color: "#e77fa8",
                fontSize: "1.6rem",
                animation: "heart-drift 1.2s ease-out forwards"
            });

            document.body.appendChild(sparkle);

            window.setTimeout(() => sparkle.remove(), 1400);
        });
    });
})();