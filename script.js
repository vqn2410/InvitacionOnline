// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTk84_UsgYfi8ihPxWEU_GbTLZ5OEozFM",
    authDomain: "invitacion-4c505.firebaseapp.com",
    projectId: "invitacion-4c505",
    storageBucket: "invitacion-4c505.firebasestorage.app",
    messagingSenderId: "217343814641",
    appId: "1:217343814641:web:116c0ba0c15827b915f250",
    measurementId: "G-0WHWWJ5RRW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const musicBtn = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
const rsvpForm = document.getElementById('rsvp-form');
const formSuccess = document.getElementById('form-success');
const attendSelect = document.getElementById('attend');
const guestsGroup = document.getElementById('guests-group');

const guestsInput = document.getElementById('guests');
const dynamicGuestsContainer = document.getElementById('dynamic-guests-container');

// Empty Admin section variable declarations removed

// Music Toggle Logic
let isPlaying = false;

musicBtn.addEventListener('click', () => {
    if (isPlaying) {
        bgMusic.pause();
        musicBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        musicBtn.style.color = 'var(--gold)';
    } else {
        bgMusic.play().catch(e => console.log('Autoplay prevented', e));
        musicBtn.innerHTML = '<i class="fas fa-music"></i>';
        musicBtn.style.color = '#fff';
    }
    isPlaying = !isPlaying;
});

// Envelope logic & Autoplay
const envelopeOverlay = document.getElementById('envelope-overlay');
const body = document.body;

envelopeOverlay.addEventListener('click', () => {
    envelopeOverlay.classList.add('open');
    body.classList.add('envelope-opened');

    // Play music on first interaction
    if (!isPlaying) {
        bgMusic.play().then(() => {
            musicBtn.innerHTML = '<i class="fas fa-music"></i>';
            isPlaying = true;
        }).catch(() => { });
    }

    // Unlock scrolling after animation ends
    setTimeout(() => {
        body.classList.remove('locked');
        setTimeout(() => {
            envelopeOverlay.style.display = 'none';
        }, 1000);
    }, 1500);
}, { once: true });


// Scroll Effects (Reveal Sections)
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);
reveal(); // Trigger on load

// Confetti Effect
document.addEventListener('DOMContentLoaded', () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 60, zIndex: 0, colors: ['#d4af37', '#fde08b', '#ffffff'] };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 20 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 250);
});

// Countdown Timer (Set to March 30, 2026, 19:00)
const countdownDate = new Date("March 30, 2026 19:00:00").getTime();

const x = setInterval(function () {
    const now = new Date().getTime();
    const distance = countdownDate - now;

    if (distance < 0) {
        clearInterval(x);
        document.getElementById("countdown").innerHTML = "<h3 style='color: var(--gold);'>¡El evento ya comenzó!</h3>";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Add leading zero
    document.getElementById("days").innerHTML = days < 10 ? '0' + days : days;
    document.getElementById("hours").innerHTML = hours < 10 ? '0' + hours : hours;
    document.getElementById("minutes").innerHTML = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById("seconds").innerHTML = seconds < 10 ? '0' + seconds : seconds;
}, 1000);

// Guests Toggle
attendSelect.addEventListener('change', (e) => {
    if (e.target.value === 'yes') {
        guestsGroup.style.display = 'block';
    } else {
        guestsGroup.style.display = 'none';
        guestsInput.value = 0;
        dynamicGuestsContainer.innerHTML = '';
    }
});

guestsInput.addEventListener('input', (e) => {
    const num = parseInt(e.target.value) || 0;
    dynamicGuestsContainer.innerHTML = ''; // Clear existing

    if (num > 0) {
        for (let i = 1; i <= num; i++) {
            const guestHtml = `
                <div class="dynamic-guest fade-in-up">
                    <p style="color: var(--gold); margin-bottom: 0.5rem; font-size: 0.9rem;">Acompañante #${i}</p>
                    <div class="guest-row">
                        <div class="form-group" style="margin-bottom: 0;">
                            <input type="text" class="guest-name" required placeholder="Nombre y Apellido" autocomplete="off">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <select class="guest-type" required>
                                <option value="" disabled selected>Seleccioná si es...</option>
                                <option value="Adulto">Adulto</option>
                                <option value="Niño/a">Niño/a</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            dynamicGuestsContainer.insertAdjacentHTML('beforeend', guestHtml);
        }
    }
});

// RSVP Form Submit
rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect data
    const btn = rsvpForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    const mainName = document.getElementById('name').value;
    const isAttending = attendSelect.value;
    const numGuests = parseInt(guestsInput.value) || 0;

    let extraGuests = [];
    if (isAttending === 'yes' && numGuests > 0) {
        const guestNames = document.querySelectorAll('.guest-name');
        const guestTypes = document.querySelectorAll('.guest-type');

        for (let i = 0; i < numGuests; i++) {
            extraGuests.push({
                name: guestNames[i] ? guestNames[i].value : '',
                type: guestTypes[i] ? guestTypes[i].value : ''
            });
        }
    }

    const registrationData = {
        name: mainName,
        attending: isAttending === 'yes' ? 'Sí' : 'No',
        numGuests: isAttending === 'yes' ? numGuests : 0,
        extraGuests: extraGuests,
        timestamp: new Date().toLocaleString()
    };

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;

    try {
        await addDoc(collection(db, "rsvps"), registrationData);
        rsvpForm.style.display = 'none';
        formSuccess.classList.remove('hidden');

        setTimeout(() => {
            rsvpForm.reset();
            dynamicGuestsContainer.innerHTML = '';
            guestsGroup.style.display = 'none';
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    } catch (error) {
        console.error("Error writing document: ", error);
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert("Hubo un error al enviar tu confirmación. Por favor, intentá de nuevo.");
    }
});
