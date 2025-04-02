console.log("lets go");

let currentSong = new Audio();
let currentSongIndex = 0;
let songs = [];

// Convert seconds to mm:ss
function formatTime(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

const playMusic = (track) => {
    currentSong.pause(); // Stop current song
    currentSong.src = "/songs/" + track;
    currentSong.currentTime = 0;
    currentSong.play();
    play.src = "pause.svg";
    document.querySelector(".songinfo").innerHTML = track.replaceAll("%20", " ");
    document.querySelector(".songtime").innerHTML = "0:00 / 0:00";

    // Update time + seekbar as song plays
    currentSong.ontimeupdate = () => {
        let current = formatTime(currentSong.currentTime);
        let duration = formatTime(currentSong.duration || 0);
        document.querySelector(".songtime").innerHTML = `${current} / ${duration}`;

        // Update seekbar progress
        let percent = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
    };
};

async function getSongs(folder) {
    let a = await fetch("http://127.0.0.1:5500/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    let songsList = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songsList.push(element.href.split("/songs/")[1]);
        }
    }
    return songsList;
}

async function main() {
    songs = await getSongs();
    let songUl = document.querySelector(".songList ul");

    for (const [index, song] of songs.entries()) {
        songUl.innerHTML += `<li>
            <img class="invert" src="music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Anurag</div>
            </div>
            <div class="playnow">
                <span>play now</span>
                <img class="invert" src="play.svg" alt="">
            </div>
        </li>`;
    }

    // Play on click
    Array.from(document.querySelectorAll(".songList li")).forEach((li, index) => {
        li.addEventListener("click", () => {
            currentSongIndex = index;
            playMusic(songs[currentSongIndex]);
        });
    });

    // Play/Pause toggle
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    // Next button
    document.getElementById("next").addEventListener("click", () => {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playMusic(songs[currentSongIndex]);
        }
    });

    // Previous button
    document.getElementById("previous").addEventListener("click", () => {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playMusic(songs[currentSongIndex]);
        }
    });

    // Seekbar click-to-seek
    const seekbar = document.querySelector(".seekbar");
    seekbar.addEventListener("click", (e) => {
        let percent = (e.offsetX / seekbar.clientWidth);
        currentSong.currentTime = percent * currentSong.duration;
    });

    // Drag-to-seek functionality
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
        document.querySelector(".left").style.left = "0"
    })
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-130%"
    })
    const volumeSlider = document.getElementById('volumeControl');

    volumeSlider.addEventListener('input', function () {
        currentSong.volume = this.value;
    });
}

main();