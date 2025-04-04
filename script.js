let currentSong = new Audio();
let currentSongIndex = 0;
let songs = [];
let currFolder;

function formatTime(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

const playMusic = (track) => {
    currentSong.pause();
    currentSong.src = `${currFolder}/${track}`;
    currentSong.currentTime = 0;
    currentSong.play();

    document.getElementById("play").src = "./Assets/pause.svg";
    document.querySelector(".songinfo").innerHTML = track.replaceAll("%20", " ");
    document.querySelector(".songtime").innerHTML = "0:00 / 0:00";

    currentSong.ontimeupdate = () => {
        let current = formatTime(currentSong.currentTime);
        let duration = formatTime(currentSong.duration || 0);
        document.querySelector(".songtime").innerHTML = `${current} / ${duration}`;

        let percent = (currentSong.currentTime / (currentSong.duration || 1)) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
    };
};

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${currFolder}/`)[1]);
        }
    }

    let songUl = document.querySelector(".songList ul");
    songUl.innerHTML = "";
    for (const [index, song] of songs.entries()) {
        songUl.innerHTML += `<li>
            <img class="invert" src="./Assets/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Anusheel</div>
            </div>
            <div class="playnow">
                <span>play now</span>
                <img class="invert" src="./Assets/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(document.querySelectorAll(".songList li")).forEach((li, index) => {
        li.addEventListener("click", () => {
            currentSongIndex = index;
            playMusic(songs[currentSongIndex]);
        });
    });

    return songs;
}

async function displayAlbums() {
    console.log("Displaying albums...");
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        // Filter only folders inside /songs/ and ignore system files
        if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
            let folder = new URL(e.href).pathname.split("/").filter(Boolean).pop();
            console.log("Extracted folder:", folder);

            try {
                let res = await fetch(`/songs/${folder}/info.json`);

                if (!res.ok) {
                    console.warn(`info.json not found for folder: ${folder}`);
                    continue;
                }

                let data = await res.json();

                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpeg" alt="">
                    <h2>${data.title}</h2>
                    <p>${data.description}</p>
                </div>`;
            } catch (err) {
                console.error(`Error fetching info.json for ${folder}`, err);
            }
        }
    }

    // Attach click listeners for all album cards
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            if (songs.length > 0) {
                currentSongIndex = 0;
                playMusic(songs[0]);
            }
        });
    });
}

function updateLibraryIcons() {
    document.querySelectorAll(".songList li").forEach((li, index) => {
        const playIcon = li.querySelector(".playnow img");
        if (index === currentSongIndex && !currentSong.paused) {
            playIcon.src = "./Assets/pause.svg";
        } else {
            playIcon.src = "./Assets/play.svg";
        }
    });
}

async function main() {
    await getSongs("songs/ncs");

    const playBtn = document.getElementById("play");
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "./Assets/pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "./Assets/play.svg";
        }
        updateLibraryIcons();
    });

    document.getElementById("next").addEventListener("click", () => {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playMusic(songs[currentSongIndex]);
        }
    });

    document.getElementById("previous").addEventListener("click", () => {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playMusic(songs[currentSongIndex]);
        }
    });

    const seekbar = document.querySelector(".seekbar");
    seekbar.addEventListener("click", (e) => {
        let percent = (e.offsetX / seekbar.clientWidth);
        currentSong.currentTime = percent * currentSong.duration;
    });

    const circle = document.querySelector(".circle");
    let isDragging = false;
    circle.addEventListener("mousedown", () => {
        isDragging = true;
    });
    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            let rect = seekbar.getBoundingClientRect();
            let offsetX = e.clientX - rect.left;
            let percent = Math.max(0, Math.min(offsetX / seekbar.clientWidth, 1));
            currentSong.currentTime = percent * currentSong.duration;
        }
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-130%";
    });

    const volumeSlider = document.getElementById('volumeControl');
    volumeSlider.addEventListener('input', function () {
        currentSong.volume = this.value;
    });

    // Volume toggle (mute/unmute) logic
    document.querySelector(".volume img").addEventListener("click", () => {
        const volumeIcon = document.querySelector(".volume img");
        const volumeSlider = document.getElementById("volumeControl");
        if (currentSong.muted) {
            currentSong.muted = false;
            volumeSlider.value = currentSong.volume;
            volumeIcon.src = "./Assets/volume.svg";
            volumeIcon.title = "Mute";
        } else {
            currentSong.muted = true;
            volumeSlider.value = 0;
            volumeIcon.src = "./Assets/mute.svg";
            volumeIcon.title = "Unmute";
        }
    });

    // Spacebar toggle for play/pause
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && e.target === document.body) {
            e.preventDefault();
            if (currentSong.paused) {
                currentSong.play();
                document.getElementById("play").src = "./Assets/pause.svg";
            } else {
                currentSong.pause();
                document.getElementById("play").src = "./Assets/play.svg";
            }
            updateLibraryIcons();
        }
    });

    // Update library icons on song play/pause
    currentSong.addEventListener("play", updateLibraryIcons);
    currentSong.addEventListener("pause", updateLibraryIcons);

    await displayAlbums();
}

main();